import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { getSession, hasAccess, pageRequiresAuth } from "@/lib/auth"
import { isLocalAuthorRequest } from "@/lib/author-mode"
import { resolveDocPage } from "@/lib/author-tools/resolve-doc"
import { runRagCheck } from "@/lib/rag-check/run"
import type { RagCheckRequest } from "@/lib/rag-check/types"

export const dynamic = "force-dynamic"

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

async function assertLocalAuthorAccess(): Promise<NextResponse | null> {
  if (process.env.OFFLINE_MODE === "true") return notFound()

  const ragCheckConfig = getConfig().ai?.ragCheck
  if (!(ragCheckConfig?.enabled ?? true)) return notFound()
  if (ragCheckConfig?.localOnly === false) return notFound()

  const headerStore = await headers()
  const host = headerStore.get("host")
  if (!isLocalAuthorRequest(host)) return notFound()

  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const ragCheckRoles = ragCheckConfig?.roles ?? []

  if (authEnabled && pageRequiresAuth(ragCheckRoles) && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (
    authEnabled &&
    ragCheckRoles.length > 0 &&
    session &&
    !hasAccess(ragCheckRoles, session.roles)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}

export async function POST(req: NextRequest) {
  const gate = await assertLocalAuthorAccess()
  if (gate) return gate

  let body: RagCheckRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 })
  }

  if (body.scope !== "page") {
    return NextResponse.json({ error: "Only scope 'page' is supported" }, { status: 400 })
  }

  if (body.evaluator !== "heuristic") {
    return NextResponse.json({ error: "Only evaluator 'heuristic' is supported" }, { status: 400 })
  }

  const config = getConfig()
  const defaults = config.ai?.ragCheck
  const chunkSize = body.chunkSize ?? defaults?.defaultChunkSize ?? 500
  const chunkOverlap = body.chunkOverlap ?? defaults?.defaultChunkOverlap ?? 80

  if (chunkSize < 100 || chunkSize > 4000) {
    return NextResponse.json({ error: "chunkSize out of range" }, { status: 400 })
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    return NextResponse.json({ error: "chunkOverlap out of range" }, { status: 400 })
  }

  const slug = body.slug.startsWith("/") ? body.slug : `/${body.slug}`
  const resolved = await resolveDocPage(slug)

  if (resolved.status === "not_found") return notFound()

  if (resolved.status === "redirect_login") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (resolved.status === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = runRagCheck(resolved.doc, {
    slug,
    scope: "page",
    chunkSize,
    chunkOverlap,
    evaluator: "heuristic",
    questions: body.questions,
  })

  return NextResponse.json(result)
}
