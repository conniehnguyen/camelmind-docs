import { NextRequest, NextResponse } from "next/server"
import { createSession, COOKIE_NAME } from "@/lib/auth"
import { getAuthConfig, isAuthEnabled } from "@/lib/config"
import { getDemoUser } from "@/lib/auth-providers/dev-mock"
import { getOidcAuthorizationUrl, isOidcConfigured } from "@/lib/auth-providers/oidc"
import crypto from "crypto"

function sanitizeReturnTo(returnTo: unknown): string {
  const sanitized = typeof returnTo === "string" ? returnTo.replace(/^\/\/+/, "/") : ""
  return sanitized.startsWith("/") ? sanitized : "/home"
}

/** Initiate sign-in — OIDC redirect or dev-mock instructions. */
export async function GET(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Auth is not enabled" }, { status: 404 })
  }

  const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get("returnTo"))
  const { provider } = getAuthConfig()

  if (provider === "oidc") {
    if (!isOidcConfigured()) {
      return NextResponse.json({ error: "OIDC is not configured" }, { status: 500 })
    }
    const state = crypto.randomBytes(16).toString("hex")
    const url = await getOidcAuthorizationUrl(returnTo, state)
    const res = NextResponse.redirect(url)
    res.cookies.set("oidc_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 })
    return res
  }

  return NextResponse.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
}

/** Dev-mock sign-in via persona selection. */
export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Auth is not enabled" }, { status: 404 })
  }

  const { provider } = getAuthConfig()
  if (provider !== "dev-mock") {
    return NextResponse.json({ error: "Use GET /api/auth/signin for OIDC login" }, { status: 400 })
  }

  const { persona, returnTo } = await req.json()
  const user = getDemoUser(persona)
  if (!user) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 })
  }

  const token = await createSession(user)
  const redirect = sanitizeReturnTo(returnTo)

  const res = NextResponse.json({ ok: true, redirectTo: redirect })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  return res
}
