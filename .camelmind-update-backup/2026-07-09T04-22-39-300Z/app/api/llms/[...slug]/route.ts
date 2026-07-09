import { NextRequest, NextResponse } from "next/server"
import { loadNav, getEntryBySlugFromConfig } from "@/lib/nav"
import { loadMdxFile, processForLLM } from "@/lib/mdx"
import { getConfig } from "@/lib/config"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params
  const slug = "/" + slugParts.join("/")

  const nav = loadNav()
  const entry = getEntryBySlugFromConfig(nav, slug)

  if (!entry) return new NextResponse("Not Found", { status: 404 })

  if (entry.roles.length > 0) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { source: rawSource } = loadMdxFile(entry.file)
  const source = processForLLM(rawSource)
  const config = getConfig()
  const baseUrl = config.url.replace(/\/$/, "")

  const directive =
    config.llms?.directive ??
    `For a complete documentation index, see ${baseUrl}/llms.txt. To read any public page as Markdown, append .md to the URL.`

  return new NextResponse(`> ${directive}\n\n${source}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
