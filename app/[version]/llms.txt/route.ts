import { getConfig } from "@/lib/config"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { buildLlmsTxtBody } from "@/lib/llms-txt"

export const revalidate = 3600

export async function generateStaticParams() {
  const { versions } = loadVersions()
  return versions.map((v) => ({ version: v.id }))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ version: string }> }
) {
  const config = getConfig()

  if (!config.ai?.llmsTxt?.enabled) {
    return new Response("Not Found", { status: 404 })
  }

  const { version } = await params
  const { versions } = loadVersions()
  const currentVersion = versions.find((v) => v.id === version)
  if (!currentVersion) return new Response("Not Found", { status: 404 })

  const nav = getNavForVersion(currentVersion.id)
  const baseUrl = config.url.replace(/\/$/, "")

  const body = buildLlmsTxtBody(nav, {
    title: `${config.title} — ${currentVersion.label}`,
    tagline: config.tagline,
    baseUrl,
  })

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
