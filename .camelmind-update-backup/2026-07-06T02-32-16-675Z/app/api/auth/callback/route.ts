import { NextRequest, NextResponse } from "next/server"
import { createSession, COOKIE_NAME } from "@/lib/auth"
import { getAuthConfig, isAuthEnabled } from "@/lib/config"
import { exchangeCodeForSession } from "@/lib/auth-providers/oidc"

export async function GET(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.redirect("/home")
  }

  const { provider } = getAuthConfig()
  if (provider !== "oidc") {
    return NextResponse.redirect("/login")
  }

  const code = req.nextUrl.searchParams.get("code")
  const stateParam = req.nextUrl.searchParams.get("state") ?? ""
  const storedState = req.cookies.get("oidc_state")?.value

  if (!code) {
    return NextResponse.redirect("/login?error=missing_code")
  }

  const [state, encodedReturnTo] = stateParam.split(":")
  if (!storedState || state !== storedState) {
    return NextResponse.redirect("/login?error=invalid_state")
  }

  try {
    const user = await exchangeCodeForSession(code)
    const token = await createSession(user)
    const returnTo = encodedReturnTo ? decodeURIComponent(encodedReturnTo) : "/home"
    const redirect = returnTo.startsWith("/") ? returnTo : "/home"

    const res = NextResponse.redirect(redirect)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    res.cookies.set("oidc_state", "", { maxAge: 0, path: "/" })
    return res
  } catch {
    return NextResponse.redirect("/login?error=oidc_failed")
  }
}
