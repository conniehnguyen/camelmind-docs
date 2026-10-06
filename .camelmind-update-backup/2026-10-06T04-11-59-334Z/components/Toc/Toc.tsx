"use client"

import { useEffect, useState } from "react"
import type { TocEntry } from "@/lib/mdx"

export function Toc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (entries.length === 0) return

    const observer = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    )

    entries.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  return (
    <aside className="hidden xl:block w-56 shrink-0 pl-6 py-8 self-start sticky top-8">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        On this page
      </p>
      <ul className="border-l border-gray-200 dark:border-gray-700">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={() => setActiveId(entry.id)}
              style={activeId === entry.id ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
              className={`block text-sm leading-snug py-1 transition-colors border-l-2 -ml-px ${
                entry.level === 3 ? "pl-5" : "pl-3"
              } ${
                activeId === entry.id
                  ? "font-semibold"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
