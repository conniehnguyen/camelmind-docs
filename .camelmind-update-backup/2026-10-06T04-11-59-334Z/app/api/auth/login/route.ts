import { NextRequest, NextResponse } from "next/server"
import { createSession, COOKIE_NAME } from "@/lib/auth"
import { getAuthConfig, isAuthEnabled } from "@/lib/config"
import { getDemoUser } from "@/lib/auth-providers/dev-mock"

function sanitizeReturnTo(returnTo: unknown): string {
  const sanitized = typeof returnTo === "string" ? returnTo.replace(/^\/\/+/, "/") : ""
  return sanitized.startsWith("/") ? sanitized : "/home"
}

/** Legacy dev-mock login endpoint — kept for backwards compatibility. */
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
