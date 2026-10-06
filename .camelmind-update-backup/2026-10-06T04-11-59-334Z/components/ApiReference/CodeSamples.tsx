"use client"

import { useState, useEffect } from "react"
import type { CodeSample } from "@/lib/api-types"

const LANG_LABELS: Record<string, string> = {
  curl:       "cURL",
  python:     "Python",
  javascript: "JavaScript",
  go:         "Go",
  ruby:       "Ruby",
  java:       "Java",
  csharp:     "C#",
  php:        "PHP",
}

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

type TabsProps = {
  samples: CodeSample[]
  active: number
  onSelect: (i: number) => void
}

function LangTabs({ samples, active, onSelect }: TabsProps) {
  return (
    <>
      {samples.map((sample, i) => (
        <button
          key={`${sample.lang}-${i}`}
          onClick={() => onSelect(i)}
          className={`px-3 py-2 text-xs font-medium shrink-0 transition-colors ${
            active === i
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {sample.label ?? LANG_LABELS[sample.lang.toLowerCase()] ?? sample.lang}
        </button>
      ))}
    </>
  )
}

type Props = {
  samples: CodeSample[]
}

export function CodeSamples({ samples }: Props) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [modalCopied, setModalCopied] = useState(false)

  const current = samples[active]

  useEffect(() => {
    if (!expanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  if (!samples.length) return null

  function copy(setFlag: (v: boolean) => void) {
    navigator.clipboard.writeText(current.source).then(() => {
      setFlag(true)
      setTimeout(() => setFlag(false), 1500)
    })
  }

  const lines = current.source.split("\n")

  return (
    <>
      {/* Inline code block */}
      <div className="rounded-lg overflow-hidden border border-gray-700 bg-[#1a1d23]">
        {/* Tabs + actions */}
        <div className="flex items-center border-b border-gray-700 overflow-x-auto">
          <LangTabs samples={samples} active={active} onSelect={setActive} />
          <div className="ml-auto flex items-center gap-0.5 pr-2 shrink-0">
            <button
              onClick={() => copy(setCopied)}
              className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
              title="Copy"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
              title="Expand"
            >
              <ExpandIcon />
            </button>
          </div>
        </div>

        {/* Code */}
        <pre className="p-4 text-[13px] leading-relaxed text-gray-200 overflow-x-auto font-mono whitespace-pre">
          <code>{current.source}</code>
        </pre>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Modal */}
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden border border-gray-700 bg-[#1a1d23] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center border-b border-gray-700 shrink-0">
              <div className="flex items-center overflow-x-auto">
                <LangTabs samples={samples} active={active} onSelect={setActive} />
              </div>
              <div className="ml-auto flex items-center gap-0.5 pr-3 shrink-0">
                <button
                  onClick={() => copy(setModalCopied)}
                  className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Copy"
                >
                  {modalCopied ? <CheckIcon /> : <CopyIcon />}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Code with line numbers */}
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="select-none text-right text-gray-600 text-[13px] font-mono px-4 py-0 leading-6 w-10 shrink-0">
                        {i + 1}
                      </td>
                      <td className="text-gray-200 text-[13px] font-mono pl-4 pr-8 py-0 leading-6 whitespace-pre">
                        {line || " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
