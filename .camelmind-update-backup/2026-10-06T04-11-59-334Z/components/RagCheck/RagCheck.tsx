"use client"

import { useCallback, useState } from "react"
import { FlaskConical } from "lucide-react"
import type { RagCheckFinding, RagCheckResponse } from "@/lib/rag-check/types"
import { RagCheckControls } from "@/components/RagCheck/RagCheckControls"
import { RagCheckSummary } from "@/components/RagCheck/RagCheckSummary"
import { RagCheckFindings } from "@/components/RagCheck/RagCheckFindings"
import { RagCheckChunks } from "@/components/RagCheck/RagCheckChunks"
import { RagCheckQuestions } from "@/components/RagCheck/RagCheckQuestions"

type Props = {
  slug: string
  title: string
  aiText: string
  docHref: string
  aiViewHref: string
  defaultChunkSize: number
  defaultChunkOverlap: number
}

export function RagCheck({
  slug,
  title,
  aiText,
  docHref,
  aiViewHref,
  defaultChunkSize,
  defaultChunkOverlap,
}: Props) {
  const [chunkSize, setChunkSize] = useState(defaultChunkSize)
  const [chunkOverlap, setChunkOverlap] = useState(defaultChunkOverlap)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RagCheckResponse | null>(null)
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [highlightLine, setHighlightLine] = useState<number | null>(null)

  const runCheck = useCallback(async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/rag-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          scope: "page",
          chunkSize,
          chunkOverlap,
          evaluator: "heuristic",
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      const data = (await res.json()) as RagCheckResponse
      setResult(data)
      setSelectedChunkId(data.chunks[0]?.id ?? null)
      setSelectedQuestionId(null)
      setHighlightLine(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed")
    } finally {
      setRunning(false)
    }
  }, [slug, chunkSize, chunkOverlap])

  const exportJson = useCallback(() => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rag-check-${slug.replace(/\//g, "-").replace(/^-/, "")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, slug])

  const handleFindingSelect = (finding: RagCheckFinding) => {
    if (finding.chunkId) {
      setSelectedChunkId(finding.chunkId)
    } else if (finding.aiTextLine) {
      const containing = result?.chunks.find(
        (c) => finding.aiTextLine! >= c.startLine && finding.aiTextLine! <= c.endLine
      )
      if (containing) setSelectedChunkId(containing.id)
    }
    if (finding.questionId) setSelectedQuestionId(finding.questionId)
    setHighlightLine(finding.aiTextLine ?? null)
  }

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionId(questionId)
    const match = result?.questions.find((q) => q.question.id === questionId)
    if (match?.retrievedChunkIds[0]) setSelectedChunkId(match.retrievedChunkIds[0])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-10 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1.5">
          <FlaskConical size={14} className="shrink-0" />
          RAG readiness check for <span className="font-medium">{title}</span>
          <a href={aiViewHref} className="underline ml-2">
            AI View
          </a>
          <a href={docHref} className="underline ml-auto">
            Back to doc
          </a>
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[38%] min-w-0 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <RagCheckChunks
            aiText={result?.aiText ?? aiText}
            chunks={result?.chunks ?? []}
            selectedChunkId={selectedChunkId}
            highlightLine={highlightLine}
            onSelectChunk={setSelectedChunkId}
          />
        </div>

        <div className="w-[34%] min-w-0 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
          <RagCheckControls
            chunkSize={chunkSize}
            chunkOverlap={chunkOverlap}
            running={running}
            onChunkSizeChange={setChunkSize}
            onChunkOverlapChange={setChunkOverlap}
            onRun={runCheck}
            onExport={exportJson}
            hasResult={!!result}
          />
          {error && (
            <div className="mx-4 mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded">{error}</div>
          )}
          {result && (
            <div className="px-4 pb-4">
              <RagCheckSummary
                summary={result.summary}
                summaryLabel={result.summaryLabel}
                retrieverLabel={result.retrieverLabel}
                summaryDisclaimer={result.summaryDisclaimer}
              />
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Test queries</h3>
                <RagCheckQuestions
                  results={result.questions}
                  selectedQuestionId={selectedQuestionId}
                  onSelectQuestion={handleQuestionSelect}
                />
              </div>
            </div>
          )}
          {!result && !running && (
            <p className="px-4 text-sm text-gray-500">
              Configure chunk settings and run a heuristic RAG readiness check. No API keys required.
            </p>
          )}
        </div>

        <div className="w-[28%] min-w-0 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Findings</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {result ? (
              <RagCheckFindings findings={result.findings} onSelectFinding={handleFindingSelect} />
            ) : (
              <p className="p-4 text-sm text-gray-500">Findings appear here after you run a check.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
