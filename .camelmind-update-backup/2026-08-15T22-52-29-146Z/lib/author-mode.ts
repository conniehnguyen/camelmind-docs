import type { SessionUser } from "@/lib/auth"
import { hasAccess } from "@/lib/auth"

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])

export function isLocalHost(host: string | null): boolean {
  if (!host) return false
  const normalized = host.trim().toLowerCase()
  const hostname = normalized.startsWith("[")
    ? normalized.slice(0, normalized.indexOf("]") + 1)
    : normalized.split(":")[0] ?? ""
  return LOCAL_HOSTS.has(hostname)
}

export function isAuthorToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.CAMELMIND_AUTHOR_TOOLS === "true"
  )
}

export function isLocalAuthorRequest(host: string | null): boolean {
  if (process.env.OFFLINE_MODE === "true") return false
  return isAuthorToolsEnabled() && isLocalHost(host)
}

export function canAccessAuthorTool(
  toolRoles: string[],
  session: SessionUser | null,
  authEnabled: boolean
): boolean {
  if (!authEnabled || toolRoles.length === 0) return true
  if (!session) return false
  return hasAccess(toolRoles, session.roles)
}
