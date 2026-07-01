"use client"

import { useState, useEffect, useRef } from "react"
import type { ParsedResponse, SchemaObject } from "@/lib/api-types"
import { buildExample } from "@/lib/api-utils"
import { useResponseContext } from "./ResponseContext"
import { ExpandableCode } from "./ExpandableCode"

function statusBadgeClass(code: string) {
  const c = code[0]
  if (c === "2") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
  if (c === "3") return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
}

type Props = {
  responses: ParsedResponse[]
  schemas: Record<string, SchemaObject>
}

export function ResponseExample({ responses, schemas }: Props) {
  const { selectedCode, setSelectedCode } = useResponseContext()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const responsesWithSchema = responses.filter((r) => r.schema)
  const current =
    (selectedCode ? responsesWithSchema.find((r) => r.statusCode === selectedCode) : null) ??
    responsesWithSchema[0]

  const json = current?.schema
    ? JSON.stringify(buildExample(current.schema, schemas), null, 2)
    : null

  useEffect(() => {
    if (!dropdownOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [dropdownOpen])

  if (!current || !json) return null

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
        Response
      </p>

      {/* Status code selector */}
      <div className="relative mb-3" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border border-gray-700 bg-[#1e2129] hover:bg-[#252830] transition-colors text-left"
        >
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${statusBadgeClass(current.statusCode)}`}>
            {current.statusCode}
          </span>
          <span className="text-sm text-gray-300 flex-1 truncate">{current.description}</span>
          <svg
            className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-700 bg-[#1a1d23] shadow-xl z-10 overflow-hidden">
            {responsesWithSchema.map((r) => (
              <button
                key={r.statusCode}
                onClick={() => {
                  setSelectedCode(r.statusCode)
                  setDropdownOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                  r.statusCode === current.statusCode ? "bg-white/5" : ""
                }`}
              >
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${statusBadgeClass(r.statusCode)}`}>
                  {r.statusCode}
                </span>
                <span className="text-sm text-gray-300 truncate">{r.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ExpandableCode code={json} />
    </div>
  )
}
