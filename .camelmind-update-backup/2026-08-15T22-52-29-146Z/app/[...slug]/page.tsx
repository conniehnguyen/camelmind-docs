import { notFound, redirect } from "next/navigation"
import {
  getAllSlugs,
  getSlugsFromConfig,
  getEntryBySlugFromConfig,
  getGroupForSlugFromConfig,
  getAncestorsForSlugFromConfig,
} from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { preprocessTabs } from "@/lib/remark-tabs"
import { getSession, hasAccess, pageRequiresAuth, shouldRedirectToLogin } from "@/lib/auth"
import { getConfig, isAuthEnabled, showLastUpdated, showLastUpdateAuthor, showFeedbackWidget } from "@/lib/config"
import { loadVersions, getVersionFromSlug, getNavForVersion } from "@/lib/versions"
import { TopNav } from "@/components/Nav/TopNav"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { Toc } from "@/components/Toc/Toc"
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs"
import { PageNav } from "@/components/PageNav/PageNav"
import { SectionCards } from "@/components/SectionCards/SectionCards"
import { DocActions } from "@/components/DocActions/DocActions"
import { LastUpdated } from "@/components/LastUpdated/LastUpdated"
import { DocFeedback } from "@/components/DocFeedback/DocFeedback"
import { DocBody } from "@/components/mdx/DocBody"
import { canSeeRagCheck, ragCheckHref } from "@/lib/rag-check/access"
import type { NavGroup } from "@/lib/nav-types"

type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  // Default (unversioned) slugs — full depth
  const defaultSlugs = getAllSlugs().map((slug) => ({
    slug: slug.replace(/^\//, "").split("/"),
  }))

  // Versioned slugs — full depth from each version's nav
  const { versions } = loadVersions()
  const versionedSlugs = versions.flatMap((v) => {
    const nav = getNavForVersion(v.id)
    return getSlugsFromConfig(nav).map((slug) => ({
      slug: slug.replace(/^\//, "").split("/"),
    }))
  })

  return [...defaultSlugs, ...versionedSlugs]
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const fullSlug = "/" + slug.join("/")

  const versionId = getVersionFromSlug(fullSlug)
  const nav = getNavForVersion(versionId)   // correct nav for this version (or default)
  const { versions } = loadVersions()

  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )

  // All lookups use the version-appropriate nav
  const navEntry = getEntryBySlugFromConfig(nav, fullSlug)
  if (!navEntry) return notFound()

  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const apiRefConfig = getConfig().apiReference
  const currentVersion = versions.find((v) => v.id === versionId)
  const versionShowsApiRef = currentVersion ? (currentVersion.api_reference !== false) : true
  const apiRef = apiRefConfig?.enabled && versionShowsApiRef
    ? { label: apiRefConfig.navLabel ?? "API Reference", href: versionId ? `/api-reference/${versionId}` : "/api-reference", roles: apiRefConfig.roles ?? [] }
    : null

  if (shouldRedirectToLogin(navEntry.roles, session)) {
    redirect(`/login?returnTo=${encodeURIComponent(fullSlug)}`)
  }

  if (pageRequiresAuth(navEntry.roles) && session && !hasAccess(navEntry.roles, session.roles)) {
    return (
      <div className="flex flex-col h-screen">
        <TopNav nav={nav.nav} userRoles={session.roles} userName={session.name} authEnabled={authEnabled} versions={versions} currentVersionId={versionId} currentSlug={fullSlug} versionSlugs={versionSlugs} apiRef={apiRef} />
        <div className="flex flex-1 items-center justify-center bg-[var(--cm-bg-primary)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--cm-text-primary)] mb-2">Access Restricted</h1>
            <p className="text-[var(--cm-text-secondary)]">You don&apos;t have permission to view this page.</p>
            <p className="text-xs text-[var(--cm-text-muted)] mt-2">
              Required roles: {navEntry.roles.join(", ")} · Your roles: {session.roles.join(", ") || "none"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activeGroup = getGroupForSlugFromConfig(nav, fullSlug) as NavGroup | null
  const ancestors = getAncestorsForSlugFromConfig(nav, fullSlug)

  // Section landing page: no `file` in nav.yml — auto-generated title + category listing from
  // navEntry's own section/children, at any nesting depth. An entry with a `file` always renders
  // that file's own content instead (full author control, no auto-generated listing appended).
  if (!navEntry.file) {
    const landingChildren = ("section" in navEntry && navEntry.section?.length ? navEntry.section : navEntry.children) ?? []
    if (landingChildren.length === 0) return notFound()

    return (
      <div className="flex flex-col h-screen">
        <TopNav nav={nav.nav} userRoles={session?.roles ?? []} userName={session?.name ?? null} authEnabled={authEnabled} versions={versions} currentVersionId={versionId} currentSlug={fullSlug} versionSlugs={versionSlugs} apiRef={apiRef} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeGroup={activeGroup} currentSlug={fullSlug} userRoles={session?.roles ?? []} authEnabled={authEnabled} />
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="flex max-w-5xl mx-auto">
              <article className="flex-1 px-4 md:px-10 py-6 md:py-8 min-w-0">
                <div data-print="hide">
                  <Breadcrumbs
                    activeGroup={activeGroup}
                    ancestors={ancestors}
                    currentEntry={navEntry}
                  />
                </div>
                <h1 className="text-3xl font-bold mb-3 text-[var(--cm-text-primary)]">{navEntry.label}</h1>
                {navEntry.description && (
                  <p className="text-base text-[var(--cm-text-secondary)] max-w-2xl leading-relaxed mb-6">
                    {navEntry.description}
                  </p>
                )}
                <div className="border-t border-[var(--cm-border)]" />
                <div data-print="hide">
                  <SectionCards entry={navEntry} />
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const { frontmatter, source: rawSource, toc, lastUpdated, lastUpdatedAuthor } = loadMdxFile(navEntry.file)
  const source = preprocessTabs(rawSource).replace(/\n+([ \t]*<\/Tab>)/g, "\n\n{' '}\n\n$1")
  const aiViewConfig = getConfig().ai?.aiView
  const aiViewRoles = aiViewConfig?.roles ?? []
  const canSeeAiView = (aiViewConfig?.enabled ?? true)
    && (!authEnabled || aiViewRoles.length === 0 || (session ? hasAccess(aiViewRoles, session.roles) : false))
  const showRagCheck = await canSeeRagCheck(session)

  return (
    <div className="flex flex-col h-screen">
      <TopNav nav={nav.nav} userRoles={session?.roles ?? []} userName={session?.name ?? null} authEnabled={authEnabled} versions={versions} currentVersionId={versionId} currentSlug={fullSlug} versionSlugs={versionSlugs} apiRef={apiRef} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeGroup={activeGroup} currentSlug={fullSlug} userRoles={session?.roles ?? []} authEnabled={authEnabled} />
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          <div className="flex max-w-5xl mx-auto">
            <article className="flex-1 px-4 md:px-10 py-6 md:py-8 min-w-0">
              <div data-print="hide">
                <Breadcrumbs
                  activeGroup={activeGroup}
                  ancestors={ancestors}
                  currentEntry={navEntry}
                />
              </div>
              <DocBody
                title={frontmatter.title}
                description={frontmatter.description}
                source={source}
                actions={
                  <div data-print="hide">
                    <DocActions
                      file={navEntry.file}
                      downloadPdf={frontmatter.download_pdf}
                      offline={process.env.OFFLINE_MODE === "true"}
                      aiViewHref={canSeeAiView ? `/ai-view${fullSlug}` : undefined}
                      ragCheckHref={showRagCheck ? ragCheckHref(fullSlug) : undefined}
                    />
                  </div>
                }
              />
              <div data-print="hide" className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  {showLastUpdated() && lastUpdated ? (
                    <LastUpdated
                      date={lastUpdated}
                      author={showLastUpdateAuthor() ? lastUpdatedAuthor : null}
                    />
                  ) : <div />}
                  {showFeedbackWidget() && (
                    <DocFeedback
                      pageTitle={frontmatter.title}
                      pageSlug={fullSlug}
                    />
                  )}
                </div>
                <PageNav activeGroup={activeGroup} currentSlug={fullSlug} />
              </div>
            </article>
            {!frontmatter.hide_table_of_contents && <Toc entries={toc} />}
          </div>
        </main>
      </div>
    </div>
  )
}
