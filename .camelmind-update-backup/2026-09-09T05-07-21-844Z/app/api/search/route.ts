import { NextRequest, NextResponse } from "next/server"
import { loadNav, getAllSlugs, getNavEntryBySlug, getSectionForSlug } from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { getSession, hasAccess } from "@/lib/auth"
import { isAuthEnabled } from "@/lib/config"
import type { NavGroup } from "@/lib/nav-types"

type SearchIndex = {
  slug: string
  title: string
  description?: string
  body: string
  group?: string       // top-level nav group (Getting Started, Platform & Security…)
  section?: string     // section label (Authorization Path, Entrance Criteria…)
  roles: string[]
}

let _index: SearchIndex[] | null = null

function buildIndex(): SearchIndex[] {
  if (_index) return _index

  const nav = loadNav()
  const slugs = getAllSlugs()
  const index: SearchIndex[] = []

  const groupMap = new Map<string, string>()
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      for (const entry of group.items) {
        groupMap.set(entry.slug, group.label)
        if (entry.section) {
          for (const child of entry.section) {
            groupMap.set(child.slug, group.label)
            if (child.children) {
              for (const grandchild of child.children) {
                groupMap.set(grandchild.slug, group.label)
              }
            }
          }
        }
      }
    }
  }

  for (const slug of slugs) {
    const entry = getNavEntryBySlug(slug)
    if (!entry || !entry.file) continue

    try {
      const { frontmatter, source } = loadMdxFile(entry.file)
      const body = source
        .replace(/<[^>]+>/g, " ")
        .replace(/[#*`>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      const sectionEntry = getSectionForSlug(slug)

      index.push({
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        body,
        group: groupMap.get(slug),
        section: sectionEntry?.label,
        roles: entry.roles ?? [],
      })
    } catch {
      // skip missing files
    }
  }

  _index = index
  return index
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const authEnabled = isAuthEnabled()

  if (authEnabled && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRoles = session?.roles ?? []
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? ""
  const filterGroup = req.nextUrl.searchParams.get("group") ?? ""
  const filterRole = req.nextUrl.searchParams.get("role") ?? ""

  const index = buildIndex()
  const accessible = authEnabled
    ? index.filter((doc) => hasAccess(doc.roles, userRoles))
    : index
  if (!q) {
    const groups = [...new Set(accessible.map((d) => d.group).filter(Boolean))]
    return NextResponse.json({ results: [], groups })
  }

  const terms = q.split(/\s+/).filter(Boolean)

  const scored = accessible
    .filter((doc) => {
      if (filterGroup && doc.group !== filterGroup) return false
      if (filterRole && !doc.roles.includes(filterRole) && doc.roles.length > 0) return false
      return true
    })
    .map((doc) => {
      const titleLower = doc.title.toLowerCase()
      const descLower = (doc.description ?? "").toLowerCase()
      const bodyLower = doc.body.toLowerCase()

      let score = 0
      for (const term of terms) {
        if (titleLower.includes(term)) score += 10
        if (descLower.includes(term)) score += 5
        if (bodyLower.includes(term)) score += 1
      }

      let excerpt = doc.description ?? ""
      if (!excerpt) {
        const idx = bodyLower.indexOf(terms[0])
        if (idx >= 0) {
          excerpt = doc.body.slice(Math.max(0, idx - 30), idx + 100).trim()
        }
      }

      return { ...doc, score, excerpt }
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ body: _body, score: _score, ...rest }) => rest)

  const groups = [...new Set(accessible.map((d) => d.group).filter(Boolean))]
  return NextResponse.json({ results: scored, groups })
}
