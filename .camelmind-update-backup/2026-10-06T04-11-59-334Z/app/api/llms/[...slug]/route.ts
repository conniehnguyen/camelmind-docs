import { NextRequest, NextResponse } from "next/server"
import { loadNav, getEntryBySlugFromConfig } from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { getConfig } from "@/lib/config"
import { buildAiReadableText } from "@/lib/ai-text"

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

  if (!entry.file) return new NextResponse("Not Found", { status: 404 })

  const { source: rawSource } = loadMdxFile(entry.file)
  const config = getConfig()

  return new NextResponse(buildAiReadableText(rawSource, config), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
