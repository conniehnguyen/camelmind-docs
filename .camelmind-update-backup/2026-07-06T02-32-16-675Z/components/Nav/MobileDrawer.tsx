"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { X, ChevronDown } from "lucide-react"
import { isNavGroup } from "@/lib/nav-types"
import type { NavEntry, NavGroup } from "@/lib/nav-types"
import type { Version } from "@/lib/versions"

type Props = {
  open: boolean
  onClose: () => void
  nav: (NavEntry | NavGroup)[]
  userRoles: string[]
  userName: string | null
  authEnabled?: boolean
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
  versionSlugs: Record<string, string[]>
}

export function MobileDrawer({
  open,
  onClose,
  nav,
  userRoles,
  userName,
  authEnabled = false,
  versions,
  currentVersionId,
  currentSlug,
  versionSlugs,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()

  // Find which group contains the current page and expand it by default
  const defaultExpanded = nav.find((item) => {
    if (!isNavGroup(item) || !item.items) return false
    return item.items.some((child) => {
      if (currentSlug === child.slug) return true
      if (child.section) return child.section.some((s) => currentSlug === s.slug || (s.children ?? []).some((d) => currentSlug === d.slug))
      return false
    })
  })?.label ?? null

  const [expandedGroup, setExpandedGroup] = useState<string | null>(defaultExpanded)

  // Close on navigation
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const canSee = (roles: string[]) =>
    !authEnabled || roles.length === 0 || roles.some((r) => userRoles.includes(r))

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = authEnabled ? "/login" : "/home"
  }

  function navigateToVersion(targetId: string) {
    const bare = currentVersionId
      ? currentSlug.replace(new RegExp(`^/${currentVersionId}`), "") || "/"
      : currentSlug
    const targetSlug = `/${targetId}${bare}`
    const available = versionSlugs[targetId] ?? []
    router.push(available.includes(targetSlug) ? targetSlug : (available[0] ?? `/${targetId}`))
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-900 text-white z-50 flex flex-col md:hidden overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <Link href="/home" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-[var(--cm-oasis-teal)] font-mono font-bold">&lt;🐪&gt;</span>
            <span className="font-bold text-base">CamelMind</span>
          </Link>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            if (isNavGroup(item)) {
              if ((item.noDropdown || !item.items) && item.slug) {
                return (
                  <Link
                    key={item.label}
                    href={item.slug}
                    className="block px-3 py-2.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800 rounded-lg"
                  >
                    {item.label}
                  </Link>
                )
              }

              const visibleItems = (item.items ?? []).filter((i) => canSee(i.roles))
              if (visibleItems.length === 0) return null
              const isExpanded = expandedGroup === item.label

              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : item.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800 rounded-lg"
                  >
                    {item.label}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-3 border-l border-gray-700 pl-3 space-y-0.5">
                      {visibleItems.map((child) => {
                        const isActive = currentSlug === child.slug ||
                          (child.section ?? []).some((s) => currentSlug === s.slug || (s.children ?? []).some((d) => currentSlug === d.slug))
                        return (
                          <Link
                            key={child.slug}
                            href={child.slug}
                            className={`block px-2 py-2 text-sm rounded-lg transition-colors ${
                              isActive
                                ? "bg-gray-700 text-white font-medium"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const entry = item as NavEntry
            if (!canSee(entry.roles)) return null
            return (
              <Link
                key={entry.slug}
                href={entry.slug}
                className="block px-3 py-2.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                {entry.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: version + user */}
        <div className="border-t border-gray-700 px-4 py-4 space-y-3">
          {/* Version selector */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Version</p>
            <div className="space-y-1">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigateToVersion(v.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    v.id === currentVersionId
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span>{v.label}</span>
                  {v.badge && (
                    <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">{v.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User — only when auth is enabled */}
          {authEnabled && (
            <div className="border-t border-gray-700 pt-3">
              {userName ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{userName}</span>
                  <button
                    onClick={signOut}
                    className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white">
                  Sign in →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
