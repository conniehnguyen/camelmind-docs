"use client"

import { useEffect, useRef } from "react"
import { Link } from "lucide-react"

type Props = {
  id?: string
  summary: string
  children: React.ReactNode
}

export function Details({ id, summary, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (!id) return
    const open = () => {
      if (window.location.hash === `#${id}`) {
        ref.current?.setAttribute("open", "")
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    open()
    window.addEventListener("hashchange", open)
    return () => window.removeEventListener("hashchange", open)
  }, [id])

  function copyAnchor() {
    if (!id) return
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url)
  }

  return (
    <details
      id={id}
      ref={ref}
      className="group my-3 rounded-lg border border-gray-200 bg-white overflow-hidden"
    >
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
        <span className="text-sm font-medium text-gray-800">{summary}</span>
        <div className="flex items-center gap-2 shrink-0">
          {id && (
            <button
              onClick={(e) => { e.preventDefault(); copyAnchor() }}
              title="Copy link to this section"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <Link size={13} />
            </button>
          )}
          <svg
            className="w-4 h-4 text-gray-400 transition-transform duration-200 group-open:rotate-180"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      <div className="px-4 pb-4 pt-2 text-sm text-gray-700 border-t border-gray-100">
        {children}
      </div>
    </details>
  )
}
