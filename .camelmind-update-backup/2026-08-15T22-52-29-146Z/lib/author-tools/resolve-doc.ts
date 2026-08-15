import {
  getSlugsFromConfig,
  getEntryBySlugFromConfig,
  getGroupForSlugFromConfig,
} from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { preprocessTabs } from "@/lib/remark-tabs"
import {
  getSession,
  hasAccess,
  pageRequiresAuth,
  shouldRedirectToLogin,
  type SessionUser,
} from "@/lib/auth"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { loadVersions, getVersionFromSlug, getNavForVersion } from "@/lib/versions"
import {
  buildAiReadableText,
  buildChunkText,
  getDirectiveLineOffset,
  getLlmsDirective,
} from "@/lib/ai-text"
import type { NavChild, NavEntry, NavGroup } from "@/lib/nav-types"
import type { FrontMatter } from "@/lib/mdx"

export type ResolvedDocPage = {
  fullSlug: string
  versionId: string | null
  navEntry: NavEntry | NavChild
  frontmatter: FrontMatter
  rawSource: string
  renderSource: string
  chunkText: string
  aiText: string
  directiveLineOffset: number
  llmsUrl: string
  activeGroup: NavGroup | null
  session: SessionUser | null
  authEnabled: boolean
  versions: ReturnType<typeof loadVersions>["versions"]
  versionSlugs: Record<string, string[]>
}

export type DocAccessResult =
  | { status: "ok"; doc: ResolvedDocPage }
  | { status: "not_found" }
  | { status: "redirect_login"; returnTo: string }
  | { status: "denied"; doc: ResolvedDocPage }

export type ToolAccessResult =
  | { status: "redirect_login"; returnTo: string }
  | { status: "denied" }

export async function resolveDocPage(fullSlug: string): Promise<DocAccessResult> {
  const versionId = getVersionFromSlug(fullSlug)
  const nav = getNavForVersion(versionId)
  const { versions } = loadVersions()
  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )

  const navEntry = getEntryBySlugFromConfig(nav, fullSlug)
  if (!navEntry || !navEntry.file) return { status: "not_found" }

  const session = await getSession()
  const authEnabled = isAuthEnabled()

  if (shouldRedirectToLogin(navEntry.roles, session)) {
    return { status: "redirect_login", returnTo: fullSlug }
  }

  const deniedForDoc =
    pageRequiresAuth(navEntry.roles) && session && !hasAccess(navEntry.roles, session.roles)

  const activeGroup = getGroupForSlugFromConfig(nav, fullSlug) as NavGroup | null
  const { frontmatter, source: rawSource } = loadMdxFile(navEntry.file)
  const renderSource = preprocessTabs(rawSource).replace(
    /\n+([ \t]*<\/Tab>)/g,
    "\n\n{' '}\n\n$1"
  )

  const config = getConfig()
  const baseUrl = config.url.replace(/\/$/, "")
  const chunkText = buildChunkText(rawSource)
  const aiText = buildAiReadableText(rawSource, config)

  const doc: ResolvedDocPage = {
    fullSlug,
    versionId,
    navEntry,
    frontmatter,
    rawSource,
    renderSource,
    chunkText,
    aiText,
    directiveLineOffset: getDirectiveLineOffset(aiText, chunkText),
    llmsUrl: `${baseUrl}/api/llms${fullSlug}`,
    activeGroup,
    session,
    authEnabled,
    versions,
    versionSlugs,
  }

  if (deniedForDoc) return { status: "denied", doc }

  return { status: "ok", doc }
}

export function checkToolAccess(
  toolRoles: string[],
  session: SessionUser | null,
  authEnabled: boolean,
  returnTo: string
): ToolAccessResult | null {
  if (shouldRedirectToLogin(toolRoles, session)) {
    return { status: "redirect_login", returnTo }
  }
  if (pageRequiresAuth(toolRoles) && session && !hasAccess(toolRoles, session.roles)) {
    return { status: "denied" }
  }
  return null
}

export { getLlmsDirective }
