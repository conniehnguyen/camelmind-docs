import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { COOKIE_NAME, getSecret } from "@/lib/auth"
import { isAuthEnabled, isPrivateSite, isPublicPath } from "@/lib/config"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rewrite /<slug>.md to /api/llms/<slug> before auth runs.
  // /api/llms is in publicPaths so the handler is always reachable.
  if (pathname.endsWith(".md") && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone()
    url.pathname = `/api/llms${pathname.slice(0, -3)}`
    return NextResponse.rewrite(url)
  }

  // Auth disabled — all traffic passes through
  if (!isAuthEnabled()) {
    return NextResponse.next()
  }

  // Always allow public paths and Next.js internals
  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // RBAC-only mode: per-page enforcement happens in page.tsx
  if (!isPrivateSite()) {
    return NextResponse.next()
  }

  // Private site mode: require valid session for all non-public paths
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("returnTo", pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
    return res
  }
}

export const config = {
  // Exclude Next.js internals and common static asset extensions served from public/
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|otf)).*)"],
}
