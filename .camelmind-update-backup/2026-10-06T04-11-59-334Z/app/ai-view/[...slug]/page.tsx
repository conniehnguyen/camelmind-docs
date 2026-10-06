import { notFound, redirect } from "next/navigation"
import { hasAccess, pageRequiresAuth } from "@/lib/auth"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { getNavForVersion } from "@/lib/versions"
import { analyzeAiFriendliness } from "@/lib/ai-view"
import { checkToolAccess, resolveDocPage } from "@/lib/author-tools/resolve-doc"
import { canSeeRagCheck, ragCheckHref } from "@/lib/rag-check/access"
import { TopNav } from "@/components/Nav/TopNav"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { DocBody } from "@/components/mdx/DocBody"
import { AiView } from "@/components/AiView/AiView"

type Props = {
  params: Promise<{ slug: string[] }>
}

// Preview of exactly what an AI/RAG pipeline ingests for a doc, plus heuristic
// AI-friendliness flags. Mirrors app/[...slug]/page.tsx's resolution/auth flow
// so an author needs no more access here than they already have to the doc itself.
export default async function AiViewPage({ params }: Props) {
  const { slug } = await params
  const fullSlug = "/" + slug.join("/")

  const aiViewConfig = getConfig().ai?.aiView
  if (!(aiViewConfig?.enabled ?? true)) return notFound()
  const aiViewRoles = aiViewConfig?.roles ?? []

  const resolved = await resolveDocPage(fullSlug)
  if (resolved.status === "not_found") return notFound()
  const returnTo = `/ai-view${fullSlug}`

  if (resolved.status === "redirect_login") {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const { doc } = resolved
  const nav = getNavForVersion(doc.versionId)
  const authEnabled = isAuthEnabled()

  const toolGate = checkToolAccess(aiViewRoles, doc.session, authEnabled, returnTo)
  if (toolGate?.status === "redirect_login") {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const deniedForDoc = resolved.status === "denied"
  const deniedForAiView =
    pageRequiresAuth(aiViewRoles) &&
    doc.session &&
    !hasAccess(aiViewRoles, doc.session.roles)

  if (deniedForDoc || deniedForAiView || toolGate?.status === "denied") {
    return (
      <div className="flex flex-col h-screen">
        <TopNav nav={nav.nav} userRoles={doc.session?.roles ?? []} userName={doc.session?.name ?? null} authEnabled={authEnabled} versions={doc.versions} currentVersionId={doc.versionId} currentSlug={fullSlug} versionSlugs={doc.versionSlugs} apiRef={null} />
        <div className="flex flex-1 items-center justify-center bg-[var(--cm-bg-primary)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--cm-text-primary)] mb-2">Access Restricted</h1>
            <p className="text-[var(--cm-text-secondary)]">You don&apos;t have permission to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const issues = analyzeAiFriendliness(doc.aiText)
  const showRagCheck = await canSeeRagCheck(doc.session)

  return (
    <div className="flex flex-col h-screen">
      <TopNav nav={nav.nav} userRoles={doc.session?.roles ?? []} userName={doc.session?.name ?? null} authEnabled={authEnabled} versions={doc.versions} currentVersionId={doc.versionId} currentSlug={fullSlug} versionSlugs={doc.versionSlugs} apiRef={null} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeGroup={doc.activeGroup} currentSlug={fullSlug} userRoles={doc.session?.roles ?? []} authEnabled={authEnabled} />
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950">
          <AiView
            aiText={doc.aiText}
            issues={issues}
            llmsUrl={doc.llmsUrl}
            docHref={fullSlug}
            ragCheckHref={showRagCheck ? ragCheckHref(fullSlug) : undefined}
            renderedDoc={
              <DocBody title={doc.frontmatter.title} description={doc.frontmatter.description} source={doc.renderSource} />
            }
          />
        </main>
      </div>
    </div>
  )
}
