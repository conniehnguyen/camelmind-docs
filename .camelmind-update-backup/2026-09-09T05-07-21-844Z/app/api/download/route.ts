import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSession } from "@/lib/auth"
import { isAuthEnabled } from "@/lib/config"
import { loadVersions } from "@/lib/versions"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (isAuthEnabled() && !session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const versionId = req.nextUrl.searchParams.get("version")
  const rawType = req.nextUrl.searchParams.get("type") ?? "zip"
  if (rawType !== "zip" && rawType !== "pdf") {
    return new NextResponse("Invalid type parameter", { status: 400 })
  }
  const type = rawType

  if (!versionId) {
    return new NextResponse("Missing version parameter", { status: 400 })
  }

  // Validate against known versions
  const { versions } = loadVersions()
  const version = versions.find((v) => v.id === versionId)
  if (!version) {
    return new NextResponse("Unknown version", { status: 404 })
  }

  // Only stable versions are available for download
  if (!version.stable) {
    return new NextResponse("Download not available for pre-release versions", { status: 403 })
  }

  if (type === "pdf") {
    const pdfPath = path.join(process.cwd(), "offline-builds", `camelmind-${versionId}.pdf`)
    if (!fs.existsSync(pdfPath)) {
      return new NextResponse("PDF not yet built for this version", { status: 404 })
    }
    const stat = fs.statSync(pdfPath)
    const buffer = fs.readFileSync(pdfPath)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="camelmind-${versionId}.pdf"`,
        "Content-Length": stat.size.toString(),
      },
    })
  }

  // Default: ZIP
  const zipPath = path.join(process.cwd(), "offline-builds", `camelmind-${versionId}-offline.zip`)
  if (!fs.existsSync(zipPath)) {
    return new NextResponse("Offline package not yet built for this version", { status: 404 })
  }
  const stat = fs.statSync(zipPath)
  const buffer = fs.readFileSync(zipPath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="camelmind-${versionId}-offline.zip"`,
      "Content-Length": stat.size.toString(),
    },
  })
}
