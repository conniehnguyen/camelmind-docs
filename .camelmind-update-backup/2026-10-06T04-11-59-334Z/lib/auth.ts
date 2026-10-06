import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getAuthConfig, isAuthEnabled } from "@/lib/config"

export type SessionUser = {
  name: string
  email: string
  roles: string[]
}

export const COOKIE_NAME = "camelmind_session"

const OFFLINE_SESSION: SessionUser = {
  name: "Offline User",
  email: "",
  roles: ["editor", "admin"],
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret && process.env.OFFLINE_MODE !== "true" && isAuthEnabled()) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(secret ?? "offline-mode-placeholder")
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(getSecret())
}

export async function getSession(): Promise<SessionUser | null> {
  if (process.env.OFFLINE_MODE === "true") return OFFLINE_SESSION
  if (!isAuthEnabled()) return null

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      name: payload.name as string,
      email: payload.email as string,
      roles: payload.roles as string[],
    }
  } catch {
    return null
  }
}

export function hasAccess(requiredRoles: string[], userRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true
  return requiredRoles.some((r) => userRoles.includes(r))
}

/** Whether a page with these nav roles requires the user to sign in. */
export function pageRequiresAuth(requiredRoles: string[]): boolean {
  if (!isAuthEnabled()) return false
  const { requireLogin } = getAuthConfig()
  if (requireLogin) return true
  return requiredRoles.length > 0
}

export function shouldRedirectToLogin(
  requiredRoles: string[],
  session: SessionUser | null
): boolean {
  if (!pageRequiresAuth(requiredRoles)) return false
  if (!session) return true
  return !hasAccess(requiredRoles, session.roles)
}

export { getSecret }
