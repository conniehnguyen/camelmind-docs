import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSession, hasAccess } from "@/lib/auth"
import { isAuthEnabled } from "@/lib/config"
import { loadNav, flattenChildren } from "@/lib/nav"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import type { NavConfig, NavEntry, NavChild } from "@/lib/nav-types"

function getAllNavEntries(nav: NavConfig): (NavEntry | NavChild)[] {
  const entries: (NavEntry | NavChild)[] = []
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      for (const entry of (item.items ?? [])) {
        entries.push(entry)
        if (entry.section) entries.push(...flattenChildren(entry.section))
      }
    } else if ("file" in item) {
      entries.push(item as NavEntry)
    }
  }
  return entries
}

function getNavEntriesForFile(file: string): (NavEntry | NavChild)[] {
  const normalized = path.normalize(file)
  const configs: NavConfig[] = [loadNav()]
  for (const v of loadVersions().versions) configs.push(getNavForVersion(v.id))
  return configs.flatMap(getAllNavEntries).filter((e) => path.normalize(e.file) === normalized)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (isAuthEnabled() && !session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const file = req.nextUrl.searchParams.get("file")
  const download = req.nextUrl.searchParams.get("download") === "1"

  if (!file) {
    return new NextResponse("Missing file param", { status: 400 })
  }

  // Only allow reading from the content directory
  const resolved = path.resolve(process.cwd(), file)
  const contentRoot = path.resolve(process.cwd(), "content")
  if (!resolved.startsWith(contentRoot)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  // RBAC: file must appear in the nav and the user must satisfy at least one entry's roles
  if (isAuthEnabled()) {
    const navEntries = getNavEntriesForFile(file)
    if (navEntries.length === 0 || !navEntries.some((e) => hasAccess(e.roles, session!.roles))) {
      return new NextResponse("Forbidden", { status: 403 })
    }
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const raw = fs.readFileSync(resolved, "utf-8")
  const filename = path.basename(resolved).replace(/\.mdx?$/, ".md")

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
  }

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`
  }

  return new NextResponse(raw, { headers })
}
