"use client"

import { useState } from "react"

export function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace("language-", "") ?? ""

  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200">
      {language && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700" style={{ backgroundColor: "#13151a" }}>
          <span className="text-xs text-gray-400 font-mono">{language}</span>
          <button
            onClick={copy}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}
      {!language && (
        <button
          onClick={copy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-white bg-gray-800 rounded px-2 py-1 transition-all flex items-center gap-1"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      )}
      <pre className="text-gray-100 p-4 overflow-x-auto text-sm leading-relaxed font-mono" style={{ backgroundColor: "#1a1d23" }}>
        <code>{children}</code>
      </pre>
    </div>
  )
}
