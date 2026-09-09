"use client"

import type { RagCheckQuestionResult } from "@/lib/rag-check/types"

type Props = {
  results: RagCheckQuestionResult[]
  selectedQuestionId: string | null
  onSelectQuestion: (questionId: string) => void
}

const STATUS_STYLE = {
  pass: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  fail: "text-red-600 dark:text-red-400",
}

export function RagCheckQuestions({ results, selectedQuestionId, onSelectQuestion }: Props) {
  if (results.length === 0) {
    return <div className="text-sm text-gray-500 p-4">No test queries generated.</div>
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto">
      {results.map((result) => (
        <button
          key={result.question.id}
          type="button"
          onClick={() => onSelectQuestion(result.question.id)}
          className={`w-full text-left text-sm p-3 rounded border ${
            selectedQuestionId === result.question.id
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">{result.question.question}</span>
            <span className={`text-xs font-semibold uppercase shrink-0 ${STATUS_STYLE[result.status]}`}>
              {result.status}
            </span>
          </div>
          {result.retrievedChunkIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Top chunks: {result.retrievedChunkIds.slice(0, 3).join(", ")}
            </p>
          )}
          {result.notes.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{result.notes.join(" ")}</p>
          )}
        </button>
      ))}
    </div>
  )
}
