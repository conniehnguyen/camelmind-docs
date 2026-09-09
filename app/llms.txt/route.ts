import { loadNav } from "@/lib/nav"
import { getConfig } from "@/lib/config"
import { loadVersions } from "@/lib/versions"
import { buildLlmsTxtBody } from "@/lib/llms-txt"

export const revalidate = 3600

export async function GET() {
  const config = getConfig()

  if (!config.ai?.llmsTxt?.enabled) {
    return new Response("Not Found", { status: 404 })
  }

  const nav = loadNav()
  const baseUrl = config.url.replace(/\/$/, "")
  const { versions } = loadVersions()

  const body = [
    buildLlmsTxtBody(nav, { title: config.title, tagline: config.tagline, baseUrl }),
    "",
    "## Versions",
    "",
    ...versions.map((v) => `- [${v.label}](${baseUrl}/${v.id}/llms.txt)`),
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
