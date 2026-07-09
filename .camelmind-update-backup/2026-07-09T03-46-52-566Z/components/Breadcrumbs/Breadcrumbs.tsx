import Link from "next/link"
import type { NavGroup, NavEntry, NavChild } from "@/lib/nav-types"

type Crumb = { label: string; slug?: string }

type Props = {
  activeGroup?: NavGroup | null
  sectionEntry?: NavEntry | null
  currentEntry?: NavEntry | NavChild | null
}

export function Breadcrumbs({ activeGroup, sectionEntry, currentEntry }: Props) {
  const crumbs: Crumb[] = []

  if (activeGroup) crumbs.push({ label: activeGroup.label })
  if (sectionEntry && sectionEntry.slug !== currentEntry?.slug) {
    crumbs.push({ label: sectionEntry.label, slug: sectionEntry.slug })
  }
  if (currentEntry) crumbs.push({ label: currentEntry.label })

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {crumb.slug ? (
            <Link href={crumb.slug} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-gray-600 dark:text-gray-300 font-medium" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
