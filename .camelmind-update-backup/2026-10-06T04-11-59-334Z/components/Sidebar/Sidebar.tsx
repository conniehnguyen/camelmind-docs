"use client"

import { useState } from "react"
import Link from "next/link"
import { NavEntry, NavGroup, NavChild } from "@/lib/nav-types"
import { Badge } from "@/components/Badge/Badge"

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

// Recursively check if any descendant matches the slug
function subtreeContains(items: NavChild[], slug: string): boolean {
  return items.some(
    (c) => c.slug === slug || (c.children ? subtreeContains(c.children, slug) : false)
  )
}

// Doc page link (leaf node inside a section)
function DocLink({ item, currentSlug, depth = 0 }: { item: NavChild; currentSlug: string; depth?: number }) {
  const isActive = currentSlug === item.slug
  const isNested = depth > 0
  const wrapperIndent = isNested ? `${depth * 7}px` : undefined

  return (
    <div style={wrapperIndent ? { paddingLeft: wrapperIndent } : {}}>
      <Link
        href={item.slug}
        style={isActive ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
        className={`flex items-center gap-1.5 py-1.5 pr-3 text-sm transition-colors ${
          isNested
            ? "pl-4 border-l-2"
            : "pl-2"
        } ${
          isActive
            ? "font-medium bg-black/5 dark:bg-white/10"
            : isNested
              ? "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        <span className="truncate">{item.label}</span>
        {item.badge && <Badge>{item.badge}</Badge>}
      </Link>
    </div>
  )
}

// Collapsible section row — renders children as DocLink or nested SectionRow
function SectionRow({
  section,
  currentSlug,
  userRoles,
  authEnabled = false,
  depth = 0,
}: {
  section: NavChild
  currentSlug: string
  userRoles: string[]
  authEnabled?: boolean
  depth?: number
}) {
  const docs = (section.children ?? []).filter((c) => canSee(c.roles, userRoles, authEnabled))
  const hasChildren = docs.length > 0

  // Open if the current page is anywhere in the subtree
  const containsCurrent =
    currentSlug === section.slug || subtreeContains(docs, currentSlug)

  const [open, setOpen] = useState(containsCurrent)

  const isNested = depth > 0
  const wrapperIndent = isNested ? `${depth * 7}px` : undefined

  // No children — render as a plain link, no arrow
  if (!hasChildren) {
    return (
      <div className="mb-0.5" style={wrapperIndent ? { paddingLeft: wrapperIndent } : {}}>
        <Link
          href={section.slug}
          style={currentSlug === section.slug ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
          className={`flex items-center gap-1.5 py-1.5 pr-2 text-sm transition-colors ${
            isNested ? "pl-4 border-l-2" : "pl-2"
          } ${
            currentSlug === section.slug
              ? "font-medium bg-black/5 dark:bg-white/10"
              : isNested
                ? "border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span className="truncate">{section.label}</span>
          {section.badge && <Badge>{section.badge}</Badge>}
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-0.5" style={wrapperIndent ? { paddingLeft: wrapperIndent } : {}}>
      {/* Section header — link navigates, chevron toggles collapse */}
      <div
        style={isNested && currentSlug === section.slug ? { borderColor: "var(--cm-active-border)" } : {}}
        className={`flex items-start rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
          isNested ? `border-l-2 ${currentSlug === section.slug ? "" : "border-transparent"}` : ""
        }`}
      >
        <Link
          href={section.slug}
          style={currentSlug === section.slug ? { color: "var(--cm-active)" } : {}}
          className={`flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-sm leading-snug transition-colors ${
            isNested ? "pl-4" : "pl-2"
          } ${
            currentSlug === section.slug
              ? "font-medium"
              : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span className="truncate">{section.label}</span>
          {section.badge && <Badge>{section.badge}</Badge>}
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-0" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-0.5 mb-1">
          {docs.map((doc) =>
            (doc.children ?? []).filter((c) => canSee(c.roles, userRoles, authEnabled)).length > 0 ? (
              <SectionRow
                key={doc.slug}
                section={doc}
                currentSlug={currentSlug}
                userRoles={userRoles}
                authEnabled={authEnabled}
                depth={depth + 1}
              />
            ) : (
              <DocLink key={doc.slug} item={doc} currentSlug={currentSlug} depth={depth + 1} />
            )
          )}
        </div>
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
        className={`flex items-center gap-1.5 px-2 pb-1 text-xs font-semibold uppercase tracking-widest transition-colors select-none ${
          isCategoryActive ? "" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        <span>{entry.label}</span>
        {entry.badge && <Badge>{entry.badge}</Badge>}
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
        {visibleItems.map((entry) =>
          entry.section ? (
            <CategoryBlock
              key={entry.slug}
              entry={entry}
              currentSlug={currentSlug}
              userRoles={userRoles}
              authEnabled={authEnabled}
            />
          ) : (
            <SectionRow
              key={entry.slug}
              section={entry as NavChild}
              currentSlug={currentSlug}
              userRoles={userRoles}
              authEnabled={authEnabled}
            />
          )
        )}
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
