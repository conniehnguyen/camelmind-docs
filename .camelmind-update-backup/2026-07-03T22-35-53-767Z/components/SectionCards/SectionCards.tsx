import Link from "next/link"
import type { NavEntry } from "@/lib/nav-types"

export function SectionCards({ entry }: { entry: NavEntry }) {
  if (!entry.section || entry.section.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide text-xs">In this section</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entry.section.map((child) => (
        <Link
          key={child.slug}
          href={child.slug}
          className="group flex flex-col gap-1 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
        >
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            {child.label}
          </span>
          {child.children && child.children.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {child.children.length} article{child.children.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            View →
          </span>
        </Link>
      ))}
      </div>
    </div>
  )
}
