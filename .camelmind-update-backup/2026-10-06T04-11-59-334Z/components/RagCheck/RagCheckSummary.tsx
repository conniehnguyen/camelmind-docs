"use client"

import { Info } from "lucide-react"
import type { RagCheckSummary } from "@/lib/rag-check/types"

const DIMENSIONS: Array<{ key: keyof RagCheckSummary; label: string; description: string }> = [
  {
    key: "retrievability",
    label: "Retrievability",
    description:
      "Estimates whether a keyword-based retriever would surface the right chunk for likely user questions (top-3 hit rate, penalized when noisy/irrelevant chunks outrank it). Low scores mean headings and opening sentences need clearer terms that match how users actually ask.",
  },
  {
    key: "chunkIndependence",
    label: "Chunk independence",
    description:
      "Estimates whether each chunk makes sense on its own if retrieved without the rest of the page — penalizes chunks that open with a vague pronoun, duplicate a neighbor, or sit under a generic heading. Low scores mean a section should restate its subject instead of relying on earlier context.",
  },
  {
    key: "groundingReadiness",
    label: "Grounding readiness",
    description:
      "A heuristic proxy for whether this page gives an LLM enough to answer confidently — no answer was actually generated or checked. Penalizes tables/code with no lead-in sentence, vague positional references (\"as shown above\"), and thin sections. Low scores mean add explanatory text before structured content.",
  },
  {
    key: "formatRobustness",
    label: "Format robustness",
    description:
      "Estimates how well this page survives being converted to the plain text an LLM ingests, based on AI-friendliness issue density. Low scores mean information may be trapped in formatting that doesn't carry over cleanly.",
  },
  {
    key: "queryCoverage",
    label: "Query coverage",
    description:
      "The share of generated test questions whose expected chunk appeared anywhere in the top 5 results — a looser secondary check than Retrievability's top-3 cutoff. Low coverage alongside high Retrievability usually means a few edge-case questions aren't covered, not a fundamental problem.",
  },
  {
    key: "crossLinkQuality",
    label: "Cross-link quality",
    description:
      "Checks whether this page actually connects to the rest of the doc set — flags links pointing to slugs that no longer exist (a dead end for any agent following the link) and pages with no outbound links at all. Low scores mean an agent working through a multi-step task is likely to get stuck here.",
  },
]

const OVERALL_DESCRIPTION =
  "A 0–100 score, same scale as the dimensions below — it's their weighted average, not a percentage itself. Weight each dimension contributes to that average: Retrievability 35%, Chunk independence 20%, Grounding readiness 15%, Format robustness 15%, Query coverage 5%, Cross-link quality 10%. If any finding is blocking-severity (a dead link, a failed retrieval test), Overall is capped at 70 regardless of the weighted average — those are treated as outright failures, not proportional deductions. Use Overall as a quick health check, then investigate the lowest-scoring dimensions instead of chasing this number directly."

type Props = {
  summary: RagCheckSummary
  summaryLabel: string
  retrieverLabel: string
  summaryDisclaimer: string
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        aria-label="What this score means"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:text-gray-600 dark:focus:text-gray-200 focus:outline-none"
      >
        <Info size={12} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-64 -translate-x-1/2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 text-xs font-normal normal-case tracking-normal text-gray-700 dark:text-gray-300 opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

export function RagCheckSummary({
  summary,
  summaryLabel,
  retrieverLabel,
  summaryDisclaimer,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400">
          {summaryLabel}
          <InfoTooltip text={OVERALL_DESCRIPTION} />
        </div>
        <div className={`text-4xl font-bold mt-1 ${scoreColor(summary.overall)}`}>{summary.overall}</div>
        <div className="text-xs text-gray-500 mt-2">Overall RAG readiness</div>
        <div className="text-xs text-gray-400 mt-3">{retrieverLabel}</div>
        <p className="text-xs text-gray-500 mt-2">{summaryDisclaimer}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {DIMENSIONS.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              {label}
              <InfoTooltip text={description} />
            </span>
            <span className={`font-semibold ${scoreColor(summary[key])}`}>{summary[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
