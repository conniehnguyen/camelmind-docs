import { getConfig, isPrivateSite } from "@/lib/config"

export const revalidate = 3600

// Named AI bots to call out explicitly, in addition to the wildcard "*" group —
// an explicit named block is a stronger discoverability signal than relying on a
// wildcard to implicitly cover them.
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "Applebot-Extended",
]

// Routes that stay anonymously reachable even when the site otherwise requires
// login (see auth.publicPaths / isPrivateSite()). Deliberately NOT the same as
// auth.publicPaths — that list also contains "/" and API routes, which would
// undercut "Disallow: /" and advertise API routes as crawlable content.
const CRAWLER_ALLOWED_PATHS = ["/home", "/llms.txt"]

function buildRuleBlock(userAgents: string[], allow: string[], disallow: string[], contentSignal: string): string {
  const lines = userAgents.map((ua) => `User-agent: ${ua}`)
  for (const path of allow) lines.push(`Allow: ${path}`)
  for (const path of disallow) lines.push(`Disallow: ${path}`)
  lines.push(`Content-Signal: ${contentSignal}`)
  return lines.join("\n")
}

export async function GET() {
  const config = getConfig()
  const baseUrl = config.url.replace(/\/$/, "")
  const robotsConfig = config.ai?.robotsTxt

  if (robotsConfig?.enabled === false) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const signal = robotsConfig?.contentSignal
  const contentSignal = [
    `search=${signal?.search ?? "yes"}`,
    `ai-input=${signal?.aiInput ?? "yes"}`,
    `ai-train=${signal?.aiTrain ?? "yes"}`,
  ].join(", ")

  // Role-gated pages are deliberately NOT enumerated here via Disallow. robots.txt
  // is unauthenticated and publicly fetchable by design, so listing exact gated
  // paths would hand out a map of "interesting" URLs to anonymous visitors for no
  // benefit — page-level RBAC already blocks access regardless of what a crawler
  // is told, so there's nothing to gain by naming those paths here. sitemap.xml
  // follows the same principle by omitting gated pages entirely.
  const allow: string[] = []
  const disallow: string[] = []

  if (isPrivateSite()) {
    disallow.push("/")
    allow.push(...CRAWLER_ALLOWED_PATHS)
  } else {
    allow.push("/")
  }

  const body = [
    buildRuleBlock(["*"], allow, disallow, contentSignal),
    "",
    buildRuleBlock(AI_BOTS, allow, disallow, contentSignal),
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n")

  return new Response(body + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
