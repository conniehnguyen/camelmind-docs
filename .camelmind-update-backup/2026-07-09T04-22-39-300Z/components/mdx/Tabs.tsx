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
    <div className="my-4">
      {/* rest of your JSX stays the same */}
    </div>
  )
}

Tab.displayName = "Tab"