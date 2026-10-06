import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import matter from "gray-matter"
import yaml from "js-yaml"
import GithubSlugger from "github-slugger"
import { resolvePartials } from "./partials"

// gray-matter's bundled YAML engine calls the js-yaml v3 API (safeLoad/safeDump),
// which js-yaml v4 removed — pass the current API explicitly.
export const matterOptions = {
  engines: {
    yaml: {
      parse: (s: string) => yaml.load(s) as object,
      stringify: (o: object) => yaml.dump(o),
    },
  },
}

export type FrontMatter = {
  title: string
  description?: string
  roles?: string[]
  tags?: string[]
  download_pdf?: string
  last_updated?: string
  hide_table_of_contents?: boolean
  badge?: string  // short pill shown next to the page title and its sidebar/nav entry, e.g. "Coming Soon"
}

export type TocEntry = {
  id: string
  text: string
  level: number
}

export type DocContent = {
  frontmatter: FrontMatter
  source: string
  toc: TocEntry[]
  lastUpdated: Date | null
  lastUpdatedAuthor: string | null
}

const TOC_EXCLUDE_MARKER = /\{\/\*\s*toc:exclude\s*\*\/\}/i
const MDX_COMMENT = /\{\/\*.*?\*\/\}/g

function extractToc(source: string): TocEntry[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const entries: TocEntry[] = []
  const slugger = new GithubSlugger()
  let match

  while ((match = headingRegex.exec(source)) !== null) {
    const level = match[1].length
    const rawText = match[2].trim()
    const excluded = TOC_EXCLUDE_MARKER.test(rawText)
    const text = rawText.replace(MDX_COMMENT, "").trim()
    // Always slug, even when excluded, so ids stay in sync with rehype-slug
    // (which slugs every rendered heading regardless of TOC visibility).
    const id = slugger.slug(text)
    if (!excluded) entries.push({ id, text, level })
  }

  return entries
}

export function processForLLM(source: string): string {
  let result = source.replace(/<LLMIgnore>[\s\S]*?<\/LLMIgnore>/g, "")
  result = result.replace(/<LLMOnly>([\s\S]*?)<\/LLMOnly>/g, "$1")
  return result.replace(/\n{3,}/g, "\n\n").trim()
}

export function loadFrontmatterOnly(filePath: string): FrontMatter {
  const fullPath = path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data } = matter(raw, matterOptions)
  return data as FrontMatter
}

// Local fallback only — reads from the on-disk .git repo, which is reliable
// in local dev but not guaranteed to exist (or have full history) in a
// deployed build environment. Prefer lib/git-history.ts's GitHub/GitLab API
// lookup for production; this is the last resort before file mtime.
const GIT_LOG_SEPARATOR = "\x1f"

function getLocalGitInfo(fullPath: string): { date: Date | null; author: string | null } {
  try {
    const result = execSync(
      `git log -1 --format="%aI${GIT_LOG_SEPARATOR}%an" -- "${fullPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim()
    if (!result) return { date: null, author: null }

    const [isoDate, author] = result.split(GIT_LOG_SEPARATOR)
    const parsed = new Date(isoDate)
    return {
      date: isNaN(parsed.getTime()) ? null : parsed,
      author: author || null,
    }
  } catch {
    // not a git repo or git unavailable
    return { date: null, author: null }
  }
}

export function loadMdxFile(filePath: string): DocContent {
  if (path.normalize(filePath).split(path.sep).includes("_partials")) {
    throw new Error(
      `"${filePath}" is under content/_partials and can't be loaded as a standalone page — it's meant to be embedded via <Partial file="..." /> instead.`
    )
  }

  const fullPath = path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw, matterOptions)
  const frontmatter = data as FrontMatter
  const resolvedContent = resolvePartials(content)

  const localGit = getLocalGitInfo(fullPath)

  let lastUpdated: Date | null = null
  if (frontmatter.last_updated) {
    const parsed = new Date(frontmatter.last_updated)
    if (!isNaN(parsed.getTime())) lastUpdated = parsed
  }
  if (!lastUpdated) {
    lastUpdated = localGit.date ?? fs.statSync(fullPath).mtime
  }

  return {
    frontmatter,
    source: resolvedContent,
    toc: extractToc(resolvedContent),
    lastUpdated,
    lastUpdatedAuthor: localGit.author,
  }
}
