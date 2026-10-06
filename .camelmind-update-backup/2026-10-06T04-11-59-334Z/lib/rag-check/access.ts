import { headers } from "next/headers"
import { getConfig, isAuthEnabled } from "@/lib/config"
import type { SessionUser } from "@/lib/auth"
import {
  canAccessAuthorTool,
  isLocalAuthorRequest,
} from "@/lib/author-mode"

export async function canSeeRagCheck(session: SessionUser | null): Promise<boolean> {
  if (process.env.OFFLINE_MODE === "true") return false

  const config = getConfig()
  const ragCheckConfig = config.ai?.ragCheck
  if (!(ragCheckConfig?.enabled ?? true)) return false
  if (ragCheckConfig?.localOnly === false) return false

  const headerStore = await headers()
  const host = headerStore.get("host")
  if (!isLocalAuthorRequest(host)) return false

  const ragCheckRoles = ragCheckConfig?.roles ?? []
  const authEnabled = isAuthEnabled()
  return canAccessAuthorTool(ragCheckRoles, session, authEnabled)
}

export function ragCheckHref(fullSlug: string): string {
  return `/rag-check${fullSlug}`
}
