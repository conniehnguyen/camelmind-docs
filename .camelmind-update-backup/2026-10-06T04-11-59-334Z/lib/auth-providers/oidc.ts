import { createRemoteJWKSet, jwtVerify } from "jose"
import { getConfig } from "@/lib/config"
import { extractRoles } from "@/lib/auth-roles"
import type { SessionUser } from "@/lib/auth"

type OidcDiscovery = {
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  issuer: string
}

let _discovery: OidcDiscovery | null = null
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function getDiscovery(): Promise<OidcDiscovery> {
  if (_discovery) return _discovery
  const { issuer } = getConfig().auth.oidc
  if (!issuer) throw new Error("OIDC issuer is not configured")

  const res = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`)
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`)
  _discovery = (await res.json()) as OidcDiscovery
  return _discovery
}

function getJwks(jwksUri: string) {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(jwksUri))
  return _jwks
}

export async function getOidcAuthorizationUrl(returnTo: string, state: string): Promise<string> {
  const { oidc } = getConfig().auth
  const { url } = getConfig()
  const discovery = await getDiscovery()

  const redirectUri = `${url.replace(/\/$/, "")}/api/auth/callback`
  const params = new URLSearchParams({
    client_id: oidc.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state: `${state}:${encodeURIComponent(returnTo)}`,
  })

  return `${discovery.authorization_endpoint}?${params}`
}

export async function exchangeCodeForSession(code: string): Promise<SessionUser> {
  const { oidc } = getConfig().auth
  const { url } = getConfig()
  const discovery = await getDiscovery()
  const redirectUri = `${url.replace(/\/$/, "")}/api/auth/callback`

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: oidc.clientId,
    client_secret: oidc.clientSecret,
  })

  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!tokenRes.ok) {
    throw new Error(`OIDC token exchange failed: ${tokenRes.status}`)
  }

  const tokens = (await tokenRes.json()) as { id_token?: string }
  if (!tokens.id_token) throw new Error("OIDC response missing id_token")

  const jwks = getJwks(discovery.jwks_uri)
  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: discovery.issuer,
    audience: oidc.clientId,
  })

  const claims = payload as Record<string, unknown>
  const roles = extractRoles(claims, oidc)

  return {
    name: (claims.name as string) ?? (claims.preferred_username as string) ?? "User",
    email: (claims.email as string) ?? "",
    roles,
  }
}

export function isOidcConfigured(): boolean {
  const { oidc } = getConfig().auth
  return Boolean(oidc.issuer && oidc.clientId && oidc.clientSecret)
}
