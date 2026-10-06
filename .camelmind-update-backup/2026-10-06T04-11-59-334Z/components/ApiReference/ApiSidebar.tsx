"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import type { ParsedSpec } from "@/lib/api-types"
import { MethodBadge } from "./MethodBadge"

type SidebarTab = {
  id: string
  label: string
  href: string
}

type Props = {
  spec: ParsedSpec
  currentSlug: string
  base?: string
  tabs?: SidebarTab[]
  activeTabId?: string
}

export function ApiSidebar({ spec, currentSlug, base = "/api-reference", tabs, activeTabId }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const activeTab = tabs?.find((t) => t.id === activeTabId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownOpen])

  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-950">
      <div className="px-4 py-4">

        {/* Spec dropdown */}
        {tabs && tabs.length > 1 && (
          <div ref={dropdownRef} className="relative mb-4">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span style={{ color: "var(--sf-active)" }}>{activeTab?.label ?? "Select API"}</span>
              <ChevronDown
                size={12}
                className={`ml-2 shrink-0 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-10 py-1">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => setDropdownOpen(false)}
                      style={isActive ? { color: "var(--sf-active)" } : {}}
                      className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? "font-medium bg-black/5 dark:bg-white/10"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isActive && <span className="text-gray-400">✓</span>}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Overview link */}
        <div className="mb-4">
          <Link
            href={base}
            style={currentSlug === base ? { color: "var(--sf-active)" } : {}}
            className={`block px-2 py-1.5 text-sm rounded transition-colors ${
              currentSlug === base
                ? "font-medium bg-black/5 dark:bg-white/10"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Overview
          </Link>
        </div>

        {/* Tags */}
        {spec.tags.map((tag) => (
          <div key={tag.slug} className="mb-4">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
              {tag.name}
            </p>
            <ul className="space-y-0.5">
              {tag.operations.map((op) => {
                const href = `${base}/${tag.slug}/${op.operationId}`
                const isActive = currentSlug === href
                return (
                  <li key={op.operationId}>
                    <Link
                      href={href}
                      style={isActive ? { borderColor: "var(--sf-active-border)", color: "var(--sf-active)" } : {}}
                      className={`flex items-center gap-2 py-1.5 pl-2 pr-2 text-xs border-l-2 rounded-r transition-colors ${
                        isActive
                          ? "font-medium bg-black/5 dark:bg-white/10"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <MethodBadge method={op.method} size="sm" />
                      <span className="truncate text-[12px]">{op.summary}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
