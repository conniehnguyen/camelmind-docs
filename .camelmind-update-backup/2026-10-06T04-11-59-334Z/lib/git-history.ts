import { getConfig } from "./config"

export type RemoteCommitInfo = {
  date: Date
  author: string | null
}

type ParsedRepo = {
  provider: "github" | "gitlab"
  owner: string
  name: string
}

const FETCH_TIMEOUT_MS = 5000
const CACHE_TTL_MS = 5 * 60 * 1000

const _cache = new Map<string, { info: RemoteCommitInfo | null; expiresAt: number }>()
let _warnedRateLimit = false

// `links.github` doubles as the source-of-truth repo URL for both GitHub and
// GitLab — provider is detected from the hostname rather than a separate field.
function parseRepoUrl(url: string | undefined): ParsedRepo | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/")
    if (parts.length < 2) return null
    const owner = parts[0]
    const name = parts[1].replace(/\.git$/, "")
    if (!owner || !name) return null

    if (parsed.hostname === "github.com") return { provider: "github", owner, name }
    if (parsed.hostname === "gitlab.com") return { provider: "gitlab", owner, name }
    return null
  } catch {
    return null
  }
}

async function fetchGithubLastCommit(repo: ParsedRepo, branch: string, relPath: string): Promise<RemoteCommitInfo | null> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/commits?path=${encodeURIComponent(relPath)}&sha=${encodeURIComponent(branch)}&per_page=1`
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) {
    if (res.status === 403 && !_warnedRateLimit) {
      _warnedRateLimit = true
      console.warn(
        "[git-history] GitHub API request failed (403 — likely rate limited). " +
          "Set GITHUB_TOKEN to raise the rate limit. Falling back to local git/mtime for last-updated info."
      )
    }
    return null
  }

  const commits = (await res.json()) as Array<{ commit?: { author?: { date?: string; name?: string } } }>
  const commit = commits[0]?.commit
  if (!commit?.author?.date) return null

  const date = new Date(commit.author.date)
  if (isNaN(date.getTime())) return null
  return { date, author: commit.author.name ?? null }
}

async function fetchGitlabLastCommit(repo: ParsedRepo, branch: string, relPath: string): Promise<RemoteCommitInfo | null> {
  const projectId = encodeURIComponent(`${repo.owner}/${repo.name}`)
  const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits?path=${encodeURIComponent(relPath)}&ref_name=${encodeURIComponent(branch)}&per_page=1`
  const headers: Record<string, string> = {}
  if (process.env.GITLAB_TOKEN) headers["PRIVATE-TOKEN"] = process.env.GITLAB_TOKEN

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) return null

  const commits = (await res.json()) as Array<{ committed_date?: string; author_name?: string }>
  const commit = commits[0]
  if (!commit?.committed_date) return null

  const date = new Date(commit.committed_date)
  if (isNaN(date.getTime())) return null
  return { date, author: commit.author_name ?? null }
}

/**
 * Looks up the last commit that touched `relPath` (a content path relative to
 * the repo root, e.g. "content/getting-started/overview.mdx") via the
 * GitHub/GitLab REST API. Returns null if the repo can't be identified, the
 * request fails, or the API is unreachable — callers should fall back to
 * local git/mtime info in that case.
 */
export async function getRemoteLastUpdated(relPath: string): Promise<RemoteCommitInfo | null> {
  const config = getConfig()
  const repo = parseRepoUrl(config.links?.github)
  if (!repo) return null

  const branch = config.repo?.branch ?? "main"
  const cacheKey = `${repo.provider}:${repo.owner}/${repo.name}:${branch}:${relPath}`

  const cached = _cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.info

  let info: RemoteCommitInfo | null = null
  try {
    info =
      repo.provider === "github"
        ? await fetchGithubLastCommit(repo, branch, relPath)
        : await fetchGitlabLastCommit(repo, branch, relPath)
  } catch {
    info = null
  }

  _cache.set(cacheKey, { info, expiresAt: Date.now() + CACHE_TTL_MS })
  return info
}
