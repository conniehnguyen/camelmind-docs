"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { NavEntry, NavGroup, isNavGroup } from "@/lib/nav-types"
import { VersionSelector } from "./VersionSelector"
import { MobileDrawer } from "./MobileDrawer"
import { SearchTrigger } from "@/components/Search/SearchModal"
import { ThemeToggle } from "./ThemeToggle"
import type { Version } from "@/lib/versions"

type Props = {
  nav: (NavEntry | NavGroup)[]
  userRoles: string[]
  userName?: string | null
  authEnabled?: boolean
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
  versionSlugs: Record<string, string[]>
  apiRef?: { label: string; href: string; roles: string[] } | null
}

export function TopNav({ nav, userRoles, userName, authEnabled = false, versions, currentVersionId, currentSlug, versionSlugs, apiRef }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = authEnabled ? "/login" : "/home"
  }

  const canSee = (roles: string[]) =>
    !authEnabled || roles.length === 0 || roles.some((r) => userRoles.includes(r))

  return (
    <>
      <nav ref={navRef} className="bg-[var(--cm-night-dune)] text-[var(--cm-parchment)] px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 border-b border-[var(--cm-border)]">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 mr-0 md:mr-4 shrink-0">
          <span className="text-[var(--cm-oasis-teal)] font-mono text-lg font-bold">&lt;</span>
          <span className="text-[var(--cm-camel-gold)] text-xl" aria-hidden="true">🐪</span>
          <span className="text-[var(--cm-oasis-teal)] font-mono text-lg font-bold">&gt;</span>
          <span className="font-bold text-lg text-[var(--cm-parchment)] ml-1">CamelMind</span>
        </Link>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {nav.map((item) => {
            if (isNavGroup(item)) {
              if ((item.noDropdown || !item.items) && item.slug) {
                return (
                  <Link key={item.label} href={item.slug} className="text-sm font-medium hover:text-gray-300">
                    {item.label}
                  </Link>
                )
              }

              const visibleItems = (item.items ?? []).filter((i) => canSee(i.roles))
              if (visibleItems.length === 0) return null

              return (
                <div key={item.label} className="relative">
                  <button
                    className="flex items-center gap-1 hover:text-gray-300 text-sm font-medium"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    <span className="text-xs">▾</span>
                  </button>

                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow-lg z-50 py-1 border border-gray-200 dark:border-gray-700">
                      {visibleItems.map((child) => (
                        <Link
                          key={child.slug}
                          href={child.slug}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            const entry = item as NavEntry
            if (!canSee(entry.roles)) return null
            return (
              <Link key={entry.slug} href={entry.slug} className="text-sm font-medium hover:text-gray-300">
                {entry.label}
              </Link>
            )
          })}
        </div>

        {/* API Reference link */}
        {apiRef && (apiRef.roles.length === 0 || apiRef.roles.some((r) => userRoles.includes(r))) && (
          <Link
            href={apiRef.href}
            className={`hidden md:block text-sm font-medium transition-colors ${
              currentSlug.startsWith("/api-reference") ? "text-[var(--cm-oasis-teal)]" : "text-[var(--cm-parchment)] hover:text-[var(--cm-oasis-teal)]"
            }`}
          >
            {apiRef.label}
          </Link>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <SearchTrigger />

          {/* Desktop: version selector + user + theme toggle */}
          <div className="hidden md:flex items-center gap-4">
            <VersionSelector
              versions={versions}
              currentVersionId={currentVersionId}
              currentSlug={currentSlug}
              versionSlugs={versionSlugs}
              isLoggedIn={!!userName || !authEnabled}
            />
            {authEnabled && (
              userName ? (
                <div className="flex items-center gap-2 border-l border-[var(--cm-border)] pl-4">
                  <span className="text-xs text-[var(--cm-text-muted)]">{userName}</span>
                  <button
                    onClick={signOut}
                    className="text-xs text-[var(--cm-text-muted)] hover:text-[var(--cm-parchment)] border border-[var(--cm-border)] hover:border-[var(--cm-oasis-teal)] px-2 py-1 rounded transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <a href="/login" className="text-xs text-[var(--cm-text-muted)] hover:text-[var(--cm-parchment)] border border-[var(--cm-border)] hover:border-[var(--cm-oasis-teal)] px-2 py-1 rounded transition-colors ml-2">
                  Sign in
                </a>
              )
            )}
            <ThemeToggle />
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 text-gray-300 hover:text-white"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        nav={nav}
        userRoles={userRoles}
        userName={userName ?? null}
        authEnabled={authEnabled}
        versions={versions}
        currentVersionId={currentVersionId}
        currentSlug={currentSlug}
        versionSlugs={versionSlugs}
      />
    </>
  )
}
