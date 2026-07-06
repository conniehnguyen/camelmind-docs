"use client"

import { useState } from "react"
import Link from "next/link"
import { NavEntry, NavGroup, NavChild } from "@/lib/nav-types"

type Props = {
  activeGroup?: NavGroup | null
  currentSlug: string
  userRoles: string[]
  authEnabled?: boolean
}

function canSee(roles: string[], userRoles: string[], authEnabled: boolean) {
  if (!authEnabled) return true
  return roles.length === 0 || roles.some((r) => userRoles.includes(r))
}

// Doc page link (leaf node inside a section)
function DocLink({ item, currentSlug }: { item: NavChild; currentSlug: string }) {
  const isActive = currentSlug === item.slug
  return (
    <li>
      <Link
        href={item.slug}
        style={isActive ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
        className={`block py-1.5 pl-4 pr-3 text-sm border-l-2 transition-colors ${
          isActive
            ? "font-medium bg-black/5 dark:bg-white/10"
            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        {item.label}
      </Link>
    </li>
  )
}

// Collapsible section row (e.g. "DoW Deployment") — collapsed by default
function SectionRow({
  section,
  currentSlug,
  userRoles,
  authEnabled = false,
}: {
  section: NavChild
  currentSlug: string
  userRoles: string[]
  authEnabled?: boolean
}) {
  const docs = (section.children ?? []).filter((c) => canSee(c.roles, userRoles, authEnabled))
  const hasChildren = docs.length > 0

  // Open only if the current page lives inside this section
  const containsCurrent =
    currentSlug === section.slug ||
    docs.some((d) => currentSlug === d.slug)

  const [open, setOpen] = useState(containsCurrent)

  // No children — render as a plain link, no arrow
  if (!hasChildren) {
    return (
      <div className="mb-0.5">
        <Link
          href={section.slug}
          style={currentSlug === section.slug ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
        className={`block py-1.5 pl-4 pr-2 text-sm border-l-2 transition-colors ${
            currentSlug === section.slug
              ? "font-medium bg-black/5 dark:bg-white/10"
              : "border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          {section.label}
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-0.5">
      {/* Section header — full-width click area toggles collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-1.5 px-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded"
      >
        <span>{section.label}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-0" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {open && (
        <ul className="mt-0.5 mb-1">
          {docs.map((doc) => (
            <DocLink key={doc.slug} item={doc} currentSlug={currentSlug} />
          ))}
        </ul>
      )}
    </div>
  )
}

// Category block (e.g. "AUTHORIZATION PATH") — label only, no arrow
function CategoryBlock({
  entry,
  currentSlug,
  userRoles,
  authEnabled = false,
}: {
  entry: NavEntry
  currentSlug: string
  userRoles: string[]
  authEnabled?: boolean
}) {
  const sections = (entry.section ?? []).filter((s) => canSee(s.roles, userRoles, authEnabled))
  const isCategoryActive = currentSlug === entry.slug

  return (
    <div className="mb-4">
      {/* Category label — ALL CAPS, highlighted when on the category landing page */}
      <Link
        href={entry.slug}
        style={isCategoryActive ? { color: "var(--cm-active)" } : {}}
        className={`block px-2 pb-1 text-xs font-semibold uppercase tracking-widest transition-colors select-none ${
          isCategoryActive ? "" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        {entry.label}
      </Link>

      {sections.map((section) => (
        <SectionRow
          key={section.slug}
          section={section}
          currentSlug={currentSlug}
          userRoles={userRoles}
          authEnabled={authEnabled}
        />
      ))}
    </div>
  )
}

function GroupSidebar({
  group,
  currentSlug,
  userRoles,
  authEnabled = false,
}: {
  group: NavGroup
  currentSlug: string
  userRoles: string[]
  authEnabled?: boolean
}) {
  const visibleItems = group.items.filter((i) => canSee(i.roles, userRoles, authEnabled))

  return (
    <aside className="hidden md:block w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-950">
      <div className="px-4 py-4">
        {visibleItems.map((entry) => (
          <CategoryBlock
            key={entry.slug}
            entry={entry}
            currentSlug={currentSlug}
            userRoles={userRoles}
            authEnabled={authEnabled}
          />
        ))}
      </div>
    </aside>
  )
}

export function Sidebar({ activeGroup, currentSlug, userRoles, authEnabled = false }: Props) {
  if (activeGroup) {
    return (
      <GroupSidebar
        group={activeGroup}
        currentSlug={currentSlug}
        userRoles={userRoles}
        authEnabled={authEnabled}
      />
    )
  }

  return (
    <aside className="hidden md:block w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto bg-white dark:bg-gray-950" />
  )
}
