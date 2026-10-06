"use client"

import { useEffect, useRef } from "react"
import type { RagCheckChunk } from "@/lib/rag-check/types"

type Props = {
  aiText: string
  chunks: RagCheckChunk[]
  selectedChunkId: string | null
  highlightLine: number | null
  onSelectChunk: (chunkId: string) => void
}

export function RagCheckChunks({
  aiText,
  chunks,
  selectedChunkId,
  highlightLine,
  onSelectChunk,
}: Props) {
  const lines = aiText.split("\n")
  const chunkByLine = new Map<number, RagCheckChunk>()
  for (const chunk of chunks) {
    for (let ln = chunk.startLine; ln <= chunk.endLine; ln++) {
      chunkByLine.set(ln, chunk)
    }
  }

  const highlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (highlightLine !== null) {
      highlightRef.current?.scrollIntoView({ block: "center" })
    }
  }, [highlightLine])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">AI-readable text & chunks</h2>
        <p className="text-xs text-gray-500 mt-1">Line numbers refer to the AI-readable text (includes llms directive).</p>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#1a1d23] text-xs font-mono leading-relaxed text-gray-200">
        {lines.map((line, idx) => {
          const lineNo = idx + 1
          const chunk = chunkByLine.get(lineNo)
          const isSelected = chunk && chunk.id === selectedChunkId
          const isHighlight = highlightLine === lineNo
          return (
            <div
              key={lineNo}
              ref={isHighlight ? highlightRef : undefined}
              className={`flex gap-3 px-4 cursor-pointer ${
                isHighlight
                  ? "bg-amber-500/20"
                  : isSelected
                    ? "bg-blue-500/15"
                    : chunk
                      ? "bg-white/5"
                      : ""
              }`}
              onClick={() => chunk && onSelectChunk(chunk.id)}
            >
              <span className="text-gray-600 select-none w-8 text-right shrink-0">{lineNo}</span>
              <span className="whitespace-pre-wrap break-words flex-1">{line || " "}</span>
            </div>
          )
        })}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 max-h-48 overflow-y-auto p-3 space-y-2">
        {chunks.map((chunk) => (
          <button
            key={chunk.id}
            type="button"
            onClick={() => onSelectChunk(chunk.id)}
            className={`w-full text-left text-xs p-2 rounded border ${
              selectedChunkId === chunk.id
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <div className="font-medium text-gray-800 dark:text-gray-200">{chunk.id}</div>
            <div className="text-gray-500">
              lines {chunk.startLine}-{chunk.endLine} | ~{chunk.tokenEstimate} tokens
            </div>
            {chunk.headingPath.length > 0 && (
              <div className="text-gray-400 truncate">{chunk.headingPath.join(" > ")}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
