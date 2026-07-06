import { loadNav, getAllPublicEntries } from "@/lib/nav"
import { loadFrontmatterOnly } from "@/lib/mdx"
import { getConfig } from "@/lib/config"

export const revalidate = 3600

export async function GET() {
  const config = getConfig()

  if (!config.llms?.enabled) {
    return new Response("Not Found", { status: 404 })
  }

  const nav = loadNav()
  const entries = getAllPublicEntries(nav)
  const baseUrl = config.url.replace(/\/$/, "")

  const lines = entries.map((entry) => {
    const frontmatter = loadFrontmatterOnly(entry.file)
    const desc = frontmatter.description ?? frontmatter.title
    return `- [${frontmatter.title}](${baseUrl}${entry.slug}): ${desc}`
  })

  const body = [
    `# ${config.title}`,
    "",
    ...(config.tagline ? [`> ${config.tagline}`, ""] : []),
    "## Docs",
    "",
    ...lines,
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
