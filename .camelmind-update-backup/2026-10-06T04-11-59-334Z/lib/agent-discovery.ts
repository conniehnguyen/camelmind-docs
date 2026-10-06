import { isPrivateSite } from "./config"
import { loadVersions, getNavForVersion } from "./versions"
import type { Version } from "./versions"
import { getPublicSlugsFromConfig } from "./nav"

// Versions to walk for crawler-facing output (sitemap.xml, robots.txt).
// Defaults to stable versions only — dev/beta versions carry a "Beta" badge and
// shouldn't be handed to crawlers unless explicitly opted in.
export function getIndexableVersions(includeVersions: "stable" | "all" = "stable"): Version[] {
  const { versions } = loadVersions()
  return includeVersions === "all" ? versions : versions.filter((v) => v.stable)
}

// Public (roles.length === 0) slugs across the indexable versions' own nav files,
// as literally written there (whatever prefix each version's nav already uses).
// Returns [] when the site requires login for everything — nav-role-public pages
// are not anonymously reachable in that mode, regardless of their roles.
export function getPublicSlugsAcrossVersions(includeVersions: "stable" | "all" = "stable"): string[] {
  if (isPrivateSite()) return []

  const slugs = new Set<string>()
  for (const version of getIndexableVersions(includeVersions)) {
    const nav = getNavForVersion(version.id)
    for (const slug of getPublicSlugsFromConfig(nav)) slugs.add(slug)
  }
  return [...slugs]
}
