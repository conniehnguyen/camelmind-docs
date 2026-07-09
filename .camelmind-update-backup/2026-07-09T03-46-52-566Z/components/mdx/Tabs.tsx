"use client"

import { useState, useEffect, useId, Children, isValidElement } from "react"

type TabProps = {
  label: string
  children: React.ReactNode
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function Tabs({ children }: { children: React.ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (child) => isValidElement(child) && (
      (child.type as { displayName?: string })?.displayName === "Tab" ||
      (child as React.ReactElement<Record<string, unknown>>).props?.label !== undefined
    )
  ) as React.ReactElement<TabProps>[]

  // Stable per-instance group id — SSR-safe, unique across multiple Tabs on the same page
  const uid = useId().replace(/[^a-z0-9]/g, "")

  const getIndexFromHash = () => {
    if (typeof window === "undefined") return 0
    const match = window.location.hash.match(new RegExp(`^#__tabbed_${uid}_(\\d+)$`))
    if (!match) return 0
    const idx = parseInt(match[1], 10) - 1 // hash is 1-based
    return idx >= 0 && idx < tabs.length ? idx : 0
  }

  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(getIndexFromHash())
    const onHashChange = () => setActive(getIndexFromHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const handleClick = (i: number) => {
    setActive(i)
    history.replaceState(null, "", `#__tabbed_${uid}_${i + 1}`)
  }

  if (tabs.length === 0) return null

  return (
    <div className="my-4">
      {/* Screen: tabbed UI — hidden in PDF via data-print="hide" */}
      <div data-print="hide" className="rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab bar — not-prose scoped here so prose styles don't bleed into buttons */}
        <div className="not-prose flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                i === active
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
        {/* Active tab content */}
        <div className="p-4 prose prose-gray max-w-none">
          {tabs[active]?.props.children}
        </div>
      </div>

      {/* PDF: all panels expanded — hidden on screen via class, shown by removing it in generator */}
      <div data-print="show" className="hidden">
        {tabs.map((tab, i) => (
          <div key={i} className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 pb-1 border-b border-gray-200">
              {tab.props.label}
            </div>
            <div className="prose prose-gray max-w-none">
              {tab.props.children}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

Tab.displayName = "Tab"
