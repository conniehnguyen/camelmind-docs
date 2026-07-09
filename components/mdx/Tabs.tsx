"use client"

import { useState, useEffect, useId, useCallback, Children, isValidElement } from "react"

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

  const getIndexFromHash = useCallback(() => {
    if (typeof window === "undefined") return 0
    const match = window.location.hash.match(new RegExp(`^#__tabbed_${uid}_(\\d+)$`))
    if (!match) return 0
    const idx = parseInt(match[1], 10) - 1 // hash is 1-based
    return idx >= 0 && idx < tabs.length ? idx : 0
  }, [tabs.length, uid])

  const [active, setActive] = useState(() => getIndexFromHash())

  useEffect(() => {
    const onHashChange = () => setActive(getIndexFromHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [getIndexFromHash])

  const handleClick = (i: number) => {
    setActive(i)
    history.replaceState(null, "", `#__tabbed_${uid}_${i + 1}`)
  }

  if (tabs.length === 0) return null

  return (
    <div className="my-4 border border-[var(--cm-border)] rounded-[var(--cm-radius-md)] overflow-hidden">
      <div className="flex border-b border-[var(--cm-border)] px-2 pt-1" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            aria-controls={`tab-panel-${uid}-${i}`}
            id={`tab-${uid}-${i}`}
            onClick={() => handleClick(i)}
            style={active === i ? { borderColor: "var(--cm-active-border)", color: "var(--cm-active)" } : {}}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === i
                ? "font-semibold"
                : "border-transparent text-[var(--cm-text-muted)] hover:text-[var(--cm-text-secondary)] hover:border-[var(--cm-border)]"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`tab-panel-${uid}-${i}`}
          aria-labelledby={`tab-${uid}-${i}`}
          hidden={active !== i}
          className="px-4 pt-4 pb-2"
        >
          {tab.props.children}
        </div>
      ))}
    </div>
  )
}

Tab.displayName = "Tab"