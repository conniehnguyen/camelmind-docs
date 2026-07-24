"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileText } from "lucide-react"
import type { Version } from "@/lib/versions"

type Props = {
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
  versionSlugs: Record<string, string[]>
  isLoggedIn?: boolean
}

export function VersionSelector({ versions, currentVersionId, currentSlug, versionSlugs, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const current = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  function navigateToVersion(targetId: string) {
    setOpen(false)

    // API reference pages use a different URL scheme (/api-reference/[version]/...)
    // so navigate directly to the target version's API reference overview
    if (currentSlug.startsWith("/api-reference")) {
      router.push(`/api-reference/${targetId}`)
      return
    }

    const bare = currentVersionId
      ? currentSlug.replace(new RegExp(`^/${currentVersionId}`), "") || "/"
      : currentSlug
    const targetSlug = `/${targetId}${bare}`
    const available = versionSlugs[targetId] ?? []
    if (available.includes(targetSlug)) {
      router.push(targetSlug)
    } else {
      router.push(available[0] ?? `/${targetId}`)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-600 text-sm text-white hover:border-gray-400 transition-colors"
      >
        <span>{current?.label ?? "version"}</span>
        {current?.badge && (
          <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
            {current.badge}
          </span>
        )}
        <span className="text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-white text-gray-900 rounded shadow-lg z-50 py-1 border border-gray-200">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center group">
              <button
                onClick={() => navigateToVersion(v.id)}
                className={`flex-1 text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 ${
                  v.id === currentVersionId ? "font-semibold text-gray-900" : ""
                }`}
              >
                <span>{v.label}</span>
                <span className="flex items-center gap-1.5">
                  {v.badge && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">
                      {v.badge}
                    </span>
                  )}
                  {!v.stable && !v.badge && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                      Unstable
                    </span>
                  )}
                  {v.stable && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      Stable
                    </span>
                  )}
                  {v.id === currentVersionId && <span className="text-gray-700">✓</span>}
                </span>
              </button>
              {isLoggedIn && v.stable && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`/api/download?version=${v.id}&type=pdf`}
                    title={`Download ${v.label} as PDF`}
                    className="px-1.5 py-2 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={14} />
                  </a>
                  <a
                    href={`/api/download?version=${v.id}`}
                    title={`Download ${v.label} for offline use`}
                    className="pr-2 pl-1 py-2 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
