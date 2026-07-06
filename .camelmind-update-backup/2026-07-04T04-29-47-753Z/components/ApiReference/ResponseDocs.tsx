"use client"

import type { ParsedResponse, SchemaObject } from "@/lib/api-types"
import { SchemaViewer } from "./SchemaViewer"
import { useResponseContext } from "./ResponseContext"

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

function SuccessRow({ response, schemas }: { response: ParsedResponse; schemas: Record<string, SchemaObject> }) {
  const { selectedCode, setSelectedCode } = useResponseContext()
  const isSelected = selectedCode === response.statusCode

  return (
    <div
      className={`rounded-lg border px-4 py-3 mb-2 cursor-pointer transition-colors ${
        isSelected
          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
      }`}
      onClick={() => setSelectedCode(response.statusCode)}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${statusBadgeClass(response.statusCode)}`}>
          {response.statusCode}
        </span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{response.description}</span>
      </div>
      {response.schema && (
        <div className="mt-2">
          {response.contentType && (
            <p className="text-xs font-mono text-gray-400 mb-2">{response.contentType}</p>
          )}
          <SchemaViewer schema={response.schema} schemas={schemas} />
        </div>
      )}
    </div>
  )
}

function ErrorRow({ response, schemas }: { response: ParsedResponse; schemas: Record<string, SchemaObject> }) {
  const { selectedCode, setSelectedCode } = useResponseContext()
  const isExpanded = selectedCode === response.statusCode

  if (isExpanded) {
    return (
      <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 bg-red-50/50 dark:bg-red-900/5">
        {/* Expanded header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${statusBadgeClass(response.statusCode)}`}>
            {response.statusCode}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{response.description}</span>
          <button
            onClick={() => setSelectedCode(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Schema */}
        {response.schema && (
          <div className="px-4 pb-4">
            {response.contentType && (
              <p className="text-xs font-mono text-gray-400 mb-2">{response.contentType}</p>
            )}
            <SchemaViewer schema={response.schema} schemas={schemas} />
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setSelectedCode(response.statusCode)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${statusBadgeClass(response.statusCode)}`}>
        {response.statusCode}
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{response.description}</span>
    </button>
  )
}

export function ResponseDocs({ responses, schemas }: Props) {
  if (!responses.length) return null

  const successResponses = responses.filter((r) => r.statusCode.startsWith("2") || r.statusCode.startsWith("3"))
  const errorResponses = responses.filter((r) => r.statusCode.startsWith("4") || r.statusCode.startsWith("5"))

  return (
    <section className="mb-8">
      {successResponses.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Responses
          </h3>
          <div className="mb-6">
            {successResponses.map((r) => (
              <SuccessRow key={r.statusCode} response={r} schemas={schemas} />
            ))}
          </div>
        </>
      )}

      {errorResponses.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Errors
          </h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            {errorResponses.map((r) => (
              <ErrorRow key={r.statusCode} response={r} schemas={schemas} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
