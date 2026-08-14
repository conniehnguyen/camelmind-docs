"use client"

import type { RagCheckFinding } from "@/lib/rag-check/types"

type Props = {
  findings: RagCheckFinding[]
  onSelectFinding: (finding: RagCheckFinding) => void
}

const GROUPS: Array<{ severity: RagCheckFinding["severity"]; label: string }> = [
  { severity: "blocking", label: "Blocking" },
  { severity: "warning", label: "Warning" },
  { severity: "note", label: "Note" },
]

export function RagCheckFindings({ findings, onSelectFinding }: Props) {
  if (findings.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">No issues found. This page looks RAG-ready for keyword retrieval.</div>
    )
  }

  return (
    <div className="p-4 space-y-5 overflow-y-auto">
      {GROUPS.map(({ severity, label }) => {
        const group = findings.filter((f) => f.severity === severity)
        if (group.length === 0) return null
        return (
          <div key={severity}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {label} ({group.length})
            </h3>
            <ul className="space-y-2">
              {group.map((finding) => (
                <li key={finding.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFinding(finding)}
                    className="w-full text-left text-sm p-2 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{finding.message}</div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{finding.recommendation}</p>
                    {(finding.aiTextLine || finding.chunkId) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {finding.aiTextLine ? `Line ${finding.aiTextLine}` : null}
                        {finding.aiTextLine && finding.chunkId ? " | " : null}
                        {finding.chunkId ?? null}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
