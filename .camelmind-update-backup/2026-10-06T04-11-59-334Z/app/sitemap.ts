import type { MetadataRoute } from "next"
import { getConfig } from "@/lib/config"
import { getPublicSlugsAcrossVersions } from "@/lib/agent-discovery"

export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getConfig()

  if (config.ai?.sitemap?.enabled === false) return []

  const baseUrl = config.url.replace(/\/$/, "")
  const staticEntries: MetadataRoute.Sitemap = [{ url: baseUrl }, { url: `${baseUrl}/home` }]

  // Nav-role-public pages are not anonymously reachable when the site requires
  // login for everything — getPublicSlugsAcrossVersions already returns [] in
  // that case, so this naturally degrades to just the static entries above.
  const docSlugs = getPublicSlugsAcrossVersions(config.ai?.sitemap?.includeVersions ?? "stable")

  return [...staticEntries, ...docSlugs.map((slug) => ({ url: `${baseUrl}${slug}` }))]
}
