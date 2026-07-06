import { notFound, redirect } from "next/navigation"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { loadApiSpec } from "@/lib/api-reference"
import { getSession, hasAccess } from "@/lib/auth"
import { loadVersions, getNavForVersion, getApiReferenceForVersion } from "@/lib/versions"
import type { ResolvedTab } from "@/lib/versions"
import { getSlugsFromConfig } from "@/lib/nav"
import { TopNav } from "@/components/Nav/TopNav"
import { ApiSidebar } from "@/components/ApiReference/ApiSidebar"
import { EndpointPage } from "@/components/ApiReference/EndpointPage"
import { ApiOverview } from "@/components/ApiReference/ApiOverview"

type Props = {
  params: Promise<{ slug?: string[] }>
}

function parseVersionFromSlug(
  slug: string[] | undefined,
  versionIds: string[]
): { versionId: string | null; rest: string[] } {
  if (!slug?.length) return { versionId: null, rest: [] }
  if (versionIds.includes(slug[0])) return { versionId: slug[0], rest: slug.slice(1) }
  return { versionId: null, rest: slug }
}

export async function generateStaticParams() {
  let config
  try { config = getConfig() } catch { return [] }

  const apiRef = config.apiReference
  if (!apiRef?.enabled) return []

  const { versions } = loadVersions()
  const params: Array<{ slug: string[] | undefined }> = [{ slug: undefined }]

  for (const version of versions) {
    const resolved = getApiReferenceForVersion(version.id, apiRef)
    if (!resolved) continue

    params.push({ slug: [version.id] })

    if (resolved.mode === "single") {
      let spec
      try { spec = loadApiSpec(resolved.file, resolved.languages) } catch { continue }
      for (const op of spec.allOperations) {
        params.push({ slug: [version.id, op.tagSlug, op.operationId] })
      }
    } else {
      for (const tab of resolved.tabs) {
        params.push({ slug: [version.id, tab.id] })
        let spec
        try { spec = loadApiSpec(tab.file, tab.languages) } catch { continue }
        for (const op of spec.allOperations) {
          params.push({ slug: [version.id, tab.id, op.tagSlug, op.operationId] })
        }
      }
    }
  }

  // No-version-prefix routes using the default (first) spec
  const defaultResolved = getApiReferenceForVersion(null, apiRef)
  if (defaultResolved?.mode === "single") {
    let defaultSpec
    try { defaultSpec = loadApiSpec(defaultResolved.file, defaultResolved.languages) } catch { return params }
    for (const op of defaultSpec.allOperations) {
      params.push({ slug: [op.tagSlug, op.operationId] })
    }
  }

  return params
}

export default async function ApiReferencePage({ params }: Props) {
  const config = getConfig()
  const apiRef = config.apiReference
  if (!apiRef?.enabled) return notFound()

  const { slug: rawSlug } = await params
  const { versions } = loadVersions()
  const versionIds = versions.map((v) => v.id)

  const { versionId, rest: afterVersion } = parseVersionFromSlug(rawSlug, versionIds)

  const resolved = getApiReferenceForVersion(versionId, apiRef)
  if (!resolved) return notFound()

  // Resolve active tab and remaining slug segments
  let activeTab: ResolvedTab | null = null
  let slug: string[]

  if (resolved.mode === "tabs") {
    const tabIds = resolved.tabs.map((t) => t.id)
    if (afterVersion.length && tabIds.includes(afterVersion[0])) {
      activeTab = resolved.tabs.find((t) => t.id === afterVersion[0])!
      slug = afterVersion.slice(1)
    } else {
      const versionBase = versionId ? `/api-reference/${versionId}` : "/api-reference"
      redirect(`${versionBase}/${resolved.tabs[0].id}`)
    }
  } else {
    slug = afterVersion
  }

  // Load spec for current tab or single spec
  const specFile = resolved.mode === "tabs" ? activeTab!.file : resolved.file
  const specLanguages = resolved.mode === "tabs" ? activeTab!.languages : resolved.languages
  let spec
  try { spec = loadApiSpec(specFile, specLanguages) } catch { return notFound() }

  // Base URL: /api-reference[/versionId][/tabId]
  const versionBase = versionId ? `/api-reference/${versionId}` : "/api-reference"
  const base = resolved.mode === "tabs" ? `${versionBase}/${activeTab!.id}` : versionBase

  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const roles = apiRef.roles ?? []

  if (!hasAccess(roles, session?.roles ?? [])) {
    if (!session) redirect(`/login?returnTo=${base}`)
    return (
      <div className="flex flex-col h-screen">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-500">You don&apos;t have permission to view the API reference.</p>
          </div>
        </div>
      </div>
    )
  }

  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => {
      const nav = getNavForVersion(v.id)
      return [v.id, getSlugsFromConfig(nav)]
    })
  )
  const nav = getNavForVersion(versionId)
  const apiRefProp = { label: apiRef.navLabel ?? "API Reference", href: "/api-reference", roles }
  const currentSlug = slug.length ? `${base}/${slug.join("/")}` : base

  // Tab switcher props for sidebar
  const sidebarTabs = resolved.mode === "tabs"
    ? resolved.tabs.map((t) => ({ id: t.id, label: t.label, href: `${versionBase}/${t.id}` }))
    : undefined
  const activeTabId = activeTab?.id

  // Overview page
  if (!slug.length) {
    return (
      <div className="flex flex-col h-screen">
        <TopNav
          nav={nav.nav}
          userRoles={session?.roles ?? []}
          userName={session?.name ?? null}
          authEnabled={authEnabled}
          versions={versions}
          currentVersionId={versionId}
          currentSlug={versionBase}
          versionSlugs={versionSlugs}
          apiRef={apiRefProp}
        />
        <div className="flex flex-1 overflow-hidden">
          <ApiSidebar spec={spec} currentSlug={base} base={base} tabs={sidebarTabs} activeTabId={activeTabId} />
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <ApiOverview spec={spec} base={base} />
          </main>
        </div>
      </div>
    )
  }

  // Tag-only slug → redirect to first endpoint
  if (slug.length === 1) {
    const tag = spec.tags.find((t) => t.slug === slug[0])
    if (!tag || !tag.operations.length) return notFound()
    redirect(`${base}/${tag.slug}/${tag.operations[0].operationId}`)
  }

  // Endpoint page
  const [tagSlug, operationId] = slug
  const op = spec.allOperations.find(
    (o) => o.tagSlug === tagSlug && o.operationId === operationId
  )
  if (!op) return notFound()

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        authEnabled={authEnabled}
        versions={versions}
        currentVersionId={versionId}
        currentSlug={currentSlug}
        versionSlugs={versionSlugs}
        apiRef={apiRefProp}
      />
      <div className="flex flex-1 overflow-hidden">
        <ApiSidebar spec={spec} currentSlug={currentSlug} base={base} tabs={sidebarTabs} activeTabId={activeTabId} />
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950 flex">
          <EndpointPage operation={op} spec={spec} />
        </main>
      </div>
    </div>
  )
}
