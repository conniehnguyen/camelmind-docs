import type { SessionUser } from "@/lib/auth"

/** Demo personas for local development — simulates what an IdP returns after OIDC login. */
export const DEMO_USERS: Record<string, SessionUser> = {
  reader: {
    name: "Alex Reader",
    email: "alex@example.com",
    roles: [],
  },
  editor: {
    name: "Sam Editor",
    email: "sam@example.com",
    roles: ["editor"],
  },
  admin: {
    name: "Taylor Admin",
    email: "taylor@example.com",
    roles: ["editor", "admin"],
  },
}

export function getDemoUser(persona: string): SessionUser | null {
  return DEMO_USERS[persona] ?? null
}

export const DEMO_PERSONAS = [
  {
    id: "reader",
    label: "Reader",
    description: "Public docs only — no special roles",
    badge: "public",
  },
  {
    id: "editor",
    label: "Editor",
    description: "Access to editor-only guides and internal docs",
    badge: "editor",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full access including admin-only pages",
    badge: "admin",
  },
] as const
