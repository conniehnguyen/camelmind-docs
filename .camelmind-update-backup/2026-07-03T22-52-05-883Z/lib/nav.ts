import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import type { NavConfig, NavEntry, NavGroup, NavChild } from "./nav-types"

export type { NavConfig, NavEntry, NavGroup, NavChild }
export { isNavGroup } from "./nav-types"

let _navCache: NavConfig | null = null

function stripPrefix(slug: string, prefix: string): string {
  if (slug.startsWith(prefix + "/")) return slug.slice(prefix.length)
  if (slug === prefix) return "/"
  return slug
}

function stripNavPrefix(nav: NavConfig, prefix: string): NavConfig {
  const s = (slug: string) => stripPrefix(slug, prefix)

  const walkChildren = (children: NavChild[]): NavChild[] =>
    children.map((c) => ({
      ...c,
      slug: s(c.slug),
      children: c.children ? walkChildren(c.children) : undefined,
    }))

  const walkEntries = (entries: NavEntry[]): NavEntry[] =>
    entries.map((e) => ({
      ...e,
      slug: s(e.slug),
      section: e.section ? walkChildren(e.section) : undefined,
    }))

  return {
    nav: nav.nav.map((item) => {
      if ("dropdown" in item) {
        const group = item as NavGroup
        return {
          ...group,
          ...(group.slug ? { slug: s(group.slug) } : {}),
          items: group.items ? walkEntries(group.items) : undefined,
        }
      }
      const entry = item as NavEntry
      return { ...entry, slug: s(entry.slug) }
    }),
  } as NavConfig
}

export function loadNav(): NavConfig {
  if (process.env.NODE_ENV !== "development" && _navCache) return _navCache

  // Derive the unversioned nav from the first stable version in versions.yml,
  // stripping the version prefix from all slugs so /v2/foo becomes /foo.
  const versionsPath = path.join(process.cwd(), "versions.yml")
  const { versions } = yaml.load(fs.readFileSync(versionsPath, "utf-8")) as {
    versions: { id: string; stable: boolean; nav: string }[]
  }
  const latest = versions.find((v) => v.stable) ?? versions[0]
  const navPath = path.join(process.cwd(), latest.nav)
  const nav = yaml.load(fs.readFileSync(navPath, "utf-8")) as NavConfig

  _navCache = stripNavPrefix(nav, `/${latest.id}`)
  return _navCache
}

export function flattenChildren(children: NavChild[]): NavChild[] {
  return children.flatMap((c) => [c, ...(c.children ? flattenChildren(c.children) : [])])
}

// Extract all slugs from any NavConfig (default or versioned)
export function getSlugsFromConfig(nav: NavConfig): string[] {
  const slugs: string[] = []
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      // noDropdown groups have a top-level slug (the direct link target)
      if (group.noDropdown && group.slug) slugs.push(group.slug)
      for (const entry of (group.items ?? [])) {
        slugs.push(entry.slug)
        if (entry.section) {
          for (const child of flattenChildren(entry.section)) {
            slugs.push(child.slug)
          }
        }
      }
    } else if ("slug" in item) {
      slugs.push((item as NavEntry).slug)
    }
  }
  return slugs
}

export function getAllSlugs(): string[] {
  return getSlugsFromConfig(loadNav())
}

// Search any NavConfig for a slug — used for both default and versioned navs
export function getEntryBySlugFromConfig(nav: NavConfig, slug: string): (NavEntry | NavChild) | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      // noDropdown group: its top-level slug maps to the first item in the group
      if (group.noDropdown && group.slug === normalized && group.items?.length) {
        return group.items[0]
      }
      for (const entry of (group.items ?? [])) {
        if (entry.slug === normalized) return entry
        if (entry.section) {
          const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
          if (match) return match
        }
      }
    } else if ("slug" in item) {
      const entry = item as NavEntry
      if (entry.slug === normalized) return entry
    }
  }

  return null
}

export function getNavEntryBySlug(slug: string): (NavEntry | NavChild) | null {
  return getEntryBySlugFromConfig(loadNav(), slug)
}

// Return the NavGroup that contains the given slug in any NavConfig
export function getGroupForSlugFromConfig(nav: NavConfig, slug: string): NavGroup | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if (!("dropdown" in item)) continue
    const group = item as NavGroup
    if (group.noDropdown && group.slug === normalized) return group
    for (const entry of (group.items ?? [])) {
      if (entry.slug === normalized) return group
      if (entry.section) {
        const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
        if (match) return group
      }
    }
  }

  return null
}

export function getGroupForSlug(slug: string): NavGroup | null {
  return getGroupForSlugFromConfig(loadNav(), slug)
}

// Return the section-root NavEntry for a slug in any NavConfig
export function getSectionForSlugFromConfig(nav: NavConfig, slug: string): NavEntry | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if (!("dropdown" in item)) continue
    for (const entry of ((item as NavGroup).items ?? [])) {
      if (entry.slug === normalized) return entry
      if (entry.section) {
        const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
        if (match) return entry
      }
    }
  }

  return null
}

export function getSectionForSlug(slug: string): NavEntry | null {
  return getSectionForSlugFromConfig(loadNav(), slug)
}

export function getAllPublicEntries(nav: NavConfig): (NavEntry | NavChild)[] {
  const entries: (NavEntry | NavChild)[] = []
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      for (const entry of (group.items ?? [])) {
        if (entry.roles.length === 0) entries.push(entry)
        if (entry.section) {
          for (const child of flattenChildren(entry.section)) {
            if (child.roles.length === 0) entries.push(child)
          }
        }
      }
    } else if ("slug" in item) {
      const entry = item as NavEntry
      if (entry.roles.length === 0) entries.push(entry)
    }
  }
  return entries
}
