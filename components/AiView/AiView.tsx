"use client"

import { useRef } from "react"
import type { ReactNode } from "react"
import { Sparkles, TriangleAlert, Info } from "lucide-react"
import type { AiViewIssue } from "@/lib/ai-view"

type Props = {
  aiText: string
  issues: AiViewIssue[]
  llmsUrl: string
  docHref: string
  ragCheckHref?: string
  renderedDoc: ReactNode
}

function IssueGroup({
  label,
  issues,
  icon,
  onSelect,
}: {
  label: string
  issues: AiViewIssue[]
  icon: ReactNode
  onSelect: (line: number) => void
}) {
  if (issues.length === 0) return null
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        {label} ({issues.length})
      </h3>
      <ul className="space-y-2">
        {issues.map((issue, idx) => (
          <li key={idx}>
            <button
              onClick={() => onSelect(issue.line)}
              className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                {icon}
                Line {issue.line}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{issue.message}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Two-pane comparison: the normally rendered doc vs. the exact text an
// AI/RAG pipeline ingests, with flagged lines highlighted and click-to-jump issues.
export function AiView({ aiText, issues, llmsUrl, docHref, ragCheckHref, renderedDoc }: Props) {
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const issueLines = new Set(issues.map((i) => i.line))
  const lines = aiText.split("\n")
  const warnings = issues.filter((i) => i.severity === "warning")
  const infos = issues.filter((i) => i.severity === "info")

  const scrollToLine = (line: number) => {
    lineRefs.current[line]?.scrollIntoView({ behavior: "instant", block: "center" })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-10 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1.5">
          <Sparkles size={14} className="shrink-0" />
          This is what an AI/RAG pipeline sees when it indexes this page — the same output served at{" "}
          <a href={llmsUrl} className="underline" target="_blank" rel="noopener noreferrer">
            {llmsUrl}
          </a>
          .
          {ragCheckHref && (
            <a href={ragCheckHref} className="underline ml-2">
              Run RAG check
            </a>
          )}
          <a href={docHref} className="underline ml-auto">
            Back to doc
          </a>
        </p>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div data-pane="rendered" className="flex-1 overflow-y-auto border-r border-gray-200 dark:border-gray-800 px-4 md:px-10 py-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Rendered doc</h2>
          {renderedDoc}
        </div>
        <div data-pane="ai-text" className="flex-1 overflow-y-auto py-6 bg-[#1a1d23]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-4 md:px-10 mb-4">
            What the AI sees
          </h2>
          <div className="text-xs leading-relaxed font-mono text-gray-200">
            {lines.map((line, idx) => {
              const lineNo = idx + 1
              const hasIssue = issueLines.has(lineNo)
              return (
                <div
                  key={lineNo}
                  ref={(el) => {
                    lineRefs.current[lineNo] = el
                  }}
                  className={`flex gap-3 px-4 md:px-10 ${hasIssue ? "bg-yellow-500/10" : ""}`}
                >
                  <span className="text-gray-600 select-none w-8 text-right shrink-0">{lineNo}</span>
                  <span className="whitespace-pre-wrap break-words">{line || " "}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div data-pane="issues" className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-800 px-4 py-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            Issues ({issues.length})
          </h2>
          {issues.length === 0 ? (
            <p className="text-sm text-gray-500">No AI-friendliness issues found.</p>
          ) : (
            <>
              <IssueGroup
                label="Warnings"
                issues={warnings}
                icon={<TriangleAlert size={13} className="text-amber-500" />}
                onSelect={scrollToLine}
              />
              <IssueGroup
                label="Notes"
                issues={infos}
                icon={<Info size={13} className="text-blue-500" />}
                onSelect={scrollToLine}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
