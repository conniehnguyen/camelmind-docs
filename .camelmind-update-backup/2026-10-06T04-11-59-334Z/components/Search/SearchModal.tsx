"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

type SearchResult = {
  slug: string
  title: string
  description?: string
  excerpt: string
  group?: string
  section?: string
  roles: string[]
}

const ROLE_FILTERS = [
  { label: "Editor", value: "editor" },
  { label: "Admin", value: "admin" },
]

const DocIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [activeGroup, setActiveGroup] = useState<string>("")
  const [activeRole, setActiveRole] = useState<string>("")
  const [selected, setSelected] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const search = useCallback(async (q: string, group: string, role: string) => {
    let data: { results: SearchResult[]; groups: string[] }

    // Try the live API; fall back to the pre-built static index (offline builds)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (group) params.set("group", group)
      if (role) params.set("role", role)
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) throw new Error("api unavailable")
      data = await res.json()
    } catch {
      const allDocs: (SearchResult & { body: string })[] = await fetch("/search-index.json").then((r) => r.json())
      const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
      const uniqueGroups = [...new Set(allDocs.map((d) => d.group).filter((g): g is string => Boolean(g)))]

      if (!terms.length) {
        data = { results: [], groups: uniqueGroups }
      } else {
        const scored = allDocs
          .filter((doc) => {
            if (group && doc.group !== group) return false
            if (role && !doc.roles.includes(role) && doc.roles.length > 0) return false
            return true
          })
          .map((doc) => {
            let score = 0
            for (const term of terms) {
              if (doc.title.toLowerCase().includes(term)) score += 10
              if ((doc.description ?? "").toLowerCase().includes(term)) score += 5
              if (doc.body.toLowerCase().includes(term)) score += 1
            }
            const idx = doc.body.toLowerCase().indexOf(terms[0])
            const excerpt = doc.description || (idx >= 0 ? doc.body.slice(Math.max(0, idx - 30), idx + 100).trim() : "")
            return { ...doc, score, excerpt }
          })
          .filter((d) => d.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
        data = { results: scored, groups: uniqueGroups }
      }
    }

    setResults(data.results ?? [])
    if (data.groups) setGroups(data.groups)
    setSelected(0)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query, activeGroup, activeRole), 150)
    return () => clearTimeout(t)
  }, [query, activeGroup, activeRole, search])

  // Load groups on open
  useEffect(() => {
    if (open) search("", "", "")
  }, [open, search])

  const navigate = (slug: string) => {
    router.push(slug)
    setOpen(false)
    setQuery("")
    setActiveGroup("")
    setActiveRole("")
  }

  const toggleGroup = (g: string) => setActiveGroup((prev) => prev === g ? "" : g)
  const toggleRole = (r: string) => setActiveRole((prev) => prev === r ? "" : r)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#1a1d23", border: "1px solid #2e3340" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #2e3340" }}>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <input
            autoFocus
            className="flex-1 text-sm outline-none bg-transparent text-gray-100 placeholder-gray-500"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1))
              if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0))
              if (e.key === "Enter" && results[selected]) navigate(results[selected].slug)
            }}
          />
          <kbd className="text-xs text-gray-500 border border-gray-600 rounded px-1.5 py-0.5">esc</kbd>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap" style={{ borderBottom: "1px solid #2e3340" }}>
          {/* Section filters */}
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => toggleGroup(g)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeGroup === g ? "#2d5a4e" : "#252830",
                color: activeGroup === g ? "#6ee7b7" : "#9ca3af",
                border: activeGroup === g ? "1px solid #34d399" : "1px solid #374151",
              }}
            >
              {g}
              {activeGroup === g && <span className="text-xs opacity-70">×</span>}
            </button>
          ))}

          {/* Divider */}
          {groups.length > 0 && (
            <span className="text-gray-700 text-xs">|</span>
          )}

          {/* Role filters */}
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => toggleRole(r.value)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeRole === r.value ? "#1e3a5f" : "#252830",
                color: activeRole === r.value ? "#93c5fd" : "#9ca3af",
                border: activeRole === r.value ? "1px solid #3b82f6" : "1px solid #374151",
              }}
            >
              {r.label}
              {activeRole === r.value && <span className="text-xs opacity-70">×</span>}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Results
              </p>
              <ul>
                {results.map((r, i) => (
                  <li key={r.slug}>
                    <button
                      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                      style={{ backgroundColor: i === selected ? "#252830" : "transparent" }}
                      onClick={() => navigate(r.slug)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <DocIcon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">{r.title}</p>
                        {(r.group || r.section) && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            {r.group && <span>{r.group}</span>}
                            {r.group && r.section && r.section !== r.title && (
                              <>
                                <span className="text-gray-700">›</span>
                                <span>{r.section}</span>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#252830", color: "#6b7280", border: "1px solid #374151" }}
                      >
                        Guide
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : query ? (
            <p className="px-4 py-8 text-sm text-gray-500 text-center">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <p className="px-4 py-8 text-xs text-gray-600 text-center">
              Type to search, or use filters to browse by section or role
            </p>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 flex gap-4 text-xs text-gray-600" style={{ borderTop: "1px solid #2e3340" }}>
          <span><kbd className="border border-gray-700 rounded px-1 text-gray-500">↑↓</kbd> navigate</span>
          <span><kbd className="border border-gray-700 rounded px-1 text-gray-500">↵</kbd> select</span>
          <span><kbd className="border border-gray-700 rounded px-1 text-gray-500">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

export function SearchTrigger() {
  return (
    <button
      onClick={() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Search</span>
      <kbd className="text-xs border border-gray-600 rounded px-1">⌘K</kbd>
    </button>
  )
}
