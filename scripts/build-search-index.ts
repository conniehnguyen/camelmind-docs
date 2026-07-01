/**
 * Generates public/search-index.json for offline builds.
 * Run before `next build` when OFFLINE_MODE=true.
 *
 * Usage: npx tsx scripts/build-search-index.ts
 */

import fs from "fs"
import path from "path"
import matter from "gray-matter"

const ROOT = path.resolve(process.cwd())
const OUT_FILE = path.join(ROOT, "public", "search-index.json")

// Resolve the latest stable version's nav file from versions.yml
const { versions } = yaml.load(fs.readFileSync(path.join(ROOT, "versions.yml"), "utf-8")) as {
  versions: { id: string; stable: boolean; nav: string }[]
}
const latestVersion = versions.find((v) => v.stable) ?? versions[0]
const NAV_FILE = path.join(ROOT, latestVersion.nav)

// Minimal YAML parser for our nav structure (avoids pulling in the full Next.js lib graph)
import yaml from "js-yaml"

type NavChild = { label: string; slug: string; roles?: string[]; children?: NavChild[] }
type NavEntry = { label: string; slug: string; file?: string; roles?: string[]; section?: NavChild[] }
type NavGroup = { label: string; dropdown?: boolean; items?: NavEntry[] }

function collectEntries(nav: (NavEntry | NavGroup)[], group?: string): Array<{ slug: string; file: string; roles: string[]; group: string; section?: string }> {
  const out: Array<{ slug: string; file: string; roles: string[]; group: string; section?: string }> = []

  for (const item of nav) {
    if ("items" in item && item.items) {
      // NavGroup
      for (const entry of item.items) {
        if (entry.file) {
          out.push({ slug: entry.slug, file: entry.file, roles: entry.roles ?? [], group: item.label })
        }
        for (const section of entry.section ?? []) {
          if ((section as NavEntry).file) {
            out.push({ slug: section.slug, file: (section as NavEntry).file!, roles: section.roles ?? [], group: item.label, section: entry.label })
          }
          for (const child of section.children ?? []) {
            if ((child as NavEntry).file) {
              out.push({ slug: child.slug, file: (child as NavEntry).file!, roles: child.roles ?? [], group: item.label, section: section.label })
            }
          }
        }
      }
    } else {
      const entry = item as NavEntry
      if (entry.file) {
        out.push({ slug: entry.slug, file: entry.file, roles: entry.roles ?? [], group: group ?? "" })
      }
    }
  }

  return out
}

function stripMdx(source: string): string {
  return source
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function main() {
  const raw = fs.readFileSync(NAV_FILE, "utf-8")
  const nav = (yaml.load(raw) as { nav: (NavEntry | NavGroup)[] }).nav

  const entries = collectEntries(nav)
  const index = []

  for (const entry of entries) {
    const filePath = path.join(ROOT, entry.file)
    if (!fs.existsSync(filePath)) continue
    const { data: frontmatter, content } = matter(fs.readFileSync(filePath, "utf-8"))

    index.push({
      slug: entry.slug,
      title: frontmatter.title ?? "",
      description: frontmatter.description ?? "",
      body: stripMdx(content),
      group: entry.group,
      section: entry.section,
      roles: entry.roles,
    })
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2))
  console.log(`search-index.json written — ${index.length} docs`)
}

main().catch((e) => { console.error(e); process.exit(1) })
