import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { getNavForVersion } from "@/lib/versions"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { hasAccess, pageRequiresAuth } from "@/lib/auth"
import { checkToolAccess, resolveDocPage } from "@/lib/author-tools/resolve-doc"
import { isLocalAuthorRequest } from "@/lib/author-mode"
import { ragCheckHref } from "@/lib/rag-check/access"
import { TopNav } from "@/components/Nav/TopNav"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { RagCheck } from "@/components/RagCheck/RagCheck"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string[] }>
}

export default async function RagCheckPage({ params }: Props) {
  const { slug } = await params
  const fullSlug = "/" + slug.join("/")

  const ragCheckConfig = getConfig().ai?.ragCheck
  if (!(ragCheckConfig?.enabled ?? true)) return notFound()
  if (ragCheckConfig?.localOnly === false) return notFound()
  if (process.env.OFFLINE_MODE === "true") return notFound()

  const headerStore = await headers()
  const host = headerStore.get("host")
  if (!isLocalAuthorRequest(host)) return notFound()

  const ragCheckRoles = ragCheckConfig?.roles ?? []
  const resolved = await resolveDocPage(fullSlug)
  if (resolved.status === "not_found") return notFound()

  const returnTo = ragCheckHref(fullSlug)

  if (resolved.status === "redirect_login") {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const { doc } = resolved
  const nav = getNavForVersion(doc.versionId)
  const authEnabled = isAuthEnabled()

  const toolGate = checkToolAccess(ragCheckRoles, doc.session, authEnabled, returnTo)
  if (toolGate?.status === "redirect_login") {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const deniedForDoc = resolved.status === "denied"
  const deniedForTool =
    pageRequiresAuth(ragCheckRoles) &&
    doc.session &&
    !hasAccess(ragCheckRoles, doc.session.roles)

  if (deniedForDoc || deniedForTool || toolGate?.status === "denied") {
    return (
      <div className="flex flex-col h-screen">
        <TopNav
          nav={nav.nav}
          userRoles={doc.session?.roles ?? []}
          userName={doc.session?.name ?? null}
          authEnabled={authEnabled}
          versions={doc.versions}
          currentVersionId={doc.versionId}
          currentSlug={fullSlug}
          versionSlugs={doc.versionSlugs}
          apiRef={null}
        />
        <div className="flex flex-1 items-center justify-center bg-[var(--cm-bg-primary)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--cm-text-primary)] mb-2">Access Restricted</h1>
            <p className="text-[var(--cm-text-secondary)]">You don&apos;t have permission to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const defaults = ragCheckConfig

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={doc.session?.roles ?? []}
        userName={doc.session?.name ?? null}
        authEnabled={authEnabled}
        versions={doc.versions}
        currentVersionId={doc.versionId}
        currentSlug={fullSlug}
        versionSlugs={doc.versionSlugs}
        apiRef={null}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeGroup={doc.activeGroup}
          currentSlug={fullSlug}
          userRoles={doc.session?.roles ?? []}
          authEnabled={authEnabled}
        />
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950">
          <RagCheck
            slug={fullSlug}
            title={doc.frontmatter.title}
            aiText={doc.aiText}
            docHref={fullSlug}
            aiViewHref={`/ai-view${fullSlug}`}
            defaultChunkSize={defaults?.defaultChunkSize ?? 500}
            defaultChunkOverlap={defaults?.defaultChunkOverlap ?? 80}
          />
        </main>
      </div>
    </div>
  )
}
