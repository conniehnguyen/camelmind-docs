import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { loadNav } from "./nav"
import type { NavConfig } from "./nav-types"
import type { ApiReferenceConfig } from "./config-types"

export type VersionApiReferenceTab = {
  id: string
  spec: string  // key into camelmind.config.ts apiReference.specs
}

export type VersionApiReference =
  | { spec: string }                       // single named spec
  | { tabs: VersionApiReferenceTab[] }     // multi-spec tabs

export type Version = {
  id: string
  label: string
  stable: boolean
  badge?: string
  nav: string
  // false = disabled, omitted/true = use first spec in registry, object = explicit config
  api_reference?: boolean | VersionApiReference
}

export type VersionsConfig = {
  versions: Version[]
}

// Resolved output types
export type ResolvedTab = {
  id: string
  label: string
  file: string
  languages?: string[]
}

export type ResolvedApiReference =
  | { mode: "single"; label: string; file: string; languages?: string[] }
  | { mode: "tabs"; tabs: ResolvedTab[] }

let _versionsCache: VersionsConfig | null = null

export function loadVersions(): VersionsConfig {
  if (_versionsCache) return _versionsCache
  const raw = fs.readFileSync(path.join(process.cwd(), "versions.yml"), "utf-8")
  _versionsCache = yaml.load(raw) as VersionsConfig
  return _versionsCache
}

// Resolve which spec(s) to show for a given version.
// Resolution: versions.yml api_reference → apiReference.specs registry → first spec in registry
// Returns null if api_reference is explicitly disabled for this version.
export function getApiReferenceForVersion(
  versionId: string | null,
  config: ApiReferenceConfig
): ResolvedApiReference | null {
  const { versions } = loadVersions()

  let versionAr: boolean | VersionApiReference | undefined
  if (versionId) {
    const v = versions.find((v) => v.id === versionId)
    versionAr = v?.api_reference
  }

  if (versionAr === false) return null

  // Default: use first spec in registry
  if (!versionAr || versionAr === true) {
    const firstEntry = Object.entries(config.specs)[0]
    if (!firstEntry) return null
    const [, entry] = firstEntry
    return { mode: "single", label: entry.label, file: entry.file, languages: config.languages }
  }

  // Tabs mode
  if ("tabs" in versionAr) {
    const tabs: ResolvedTab[] = versionAr.tabs.flatMap((tab) => {
      const entry = config.specs[tab.spec]
      if (!entry) return []
      return [{ id: tab.id, label: entry.label, file: entry.file, languages: config.languages }]
    })
    return tabs.length ? { mode: "tabs", tabs } : null
  }

  // Single named spec
  const entry = config.specs[versionAr.spec]
  if (!entry) return null
  return { mode: "single", label: entry.label, file: entry.file, languages: config.languages }
}

export function getVersionFromSlug(slug: string): string | null {
  const { versions } = loadVersions()
  for (const v of versions) {
    if (slug.startsWith(`/${v.id}/`) || slug === `/${v.id}`) return v.id
  }
  return null
}

export function getNavForVersion(versionId: string | null): NavConfig {
  if (!versionId) return loadNav()
  const { versions } = loadVersions()
  const v = versions.find((v) => v.id === versionId)
  if (!v) return loadNav()

  const raw = fs.readFileSync(path.join(process.cwd(), v.nav), "utf-8")
  return yaml.load(raw) as NavConfig
}

export function getLatestVersion(): Version {
  const { versions } = loadVersions()
  return versions[0]
}

export function stripVersionPrefix(slug: string, versionId: string): string {
  return slug.replace(new RegExp(`^/${versionId}`), "") || "/"
}

export function swapVersion(slug: string, currentVersionId: string | null, targetVersionId: string): string {
  const bare = currentVersionId ? stripVersionPrefix(slug, currentVersionId) : slug
  return `/${targetVersionId}${bare}`
}
