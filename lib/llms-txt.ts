import { getAllPublicEntries, type NavConfig } from "./nav"
import { loadFrontmatterOnly } from "./mdx"

export function buildLlmsTxtBody(
  nav: NavConfig,
  opts: { title: string; tagline?: string; baseUrl: string }
): string {
  const entries = getAllPublicEntries(nav)

  const lines = entries.filter((entry) => entry.file).map((entry) => {
    const frontmatter = loadFrontmatterOnly(entry.file!)
    const desc = frontmatter.description ?? frontmatter.title
    return `- [${frontmatter.title}](${opts.baseUrl}${entry.slug}): ${desc}`
  })

  return [
    `# ${opts.title}`,
    "",
    ...(opts.tagline ? [`> ${opts.tagline}`, ""] : []),
    "## Docs",
    "",
    ...lines,
  ].join("\n")
}
