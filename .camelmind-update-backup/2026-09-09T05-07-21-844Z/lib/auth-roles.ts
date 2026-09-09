import type { OidcConfig } from "./config-types"

/** Read a nested claim path like "realm_access.roles" from a JWT payload. */
export function getClaimValue(claims: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let current: unknown = claims
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function extractRoles(
  claims: Record<string, unknown>,
  oidc: Pick<OidcConfig, "rolesClaim" | "roleMapping">
): string[] {
  const raw = getClaimValue(claims, oidc.rolesClaim)
  const fromToken = Array.isArray(raw)
    ? raw.filter((r): r is string => typeof r === "string")
    : typeof raw === "string"
      ? [raw]
      : []

  if (Object.keys(oidc.roleMapping).length === 0) return fromToken

  return fromToken.map((r) => oidc.roleMapping[r] ?? r)
}
