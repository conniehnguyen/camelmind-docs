"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"

type Step = "idle" | "yes" | "no" | "yes-done" | "no-done"

const YES_REASONS = [
  { value: "accurate", label: "Accurate", description: "Accurately describes the product or feature." },
  { value: "solved", label: "Solved my issue", description: "Helped me resolve an issue." },
  { value: "clear", label: "Easy to understand", description: "Easy to follow and comprehend." },
  { value: "decided", label: "Helped me decide to use the product", description: "Convinced me to adopt the product or feature." },
  { value: "other", label: "Another reason", description: "" },
]

const NO_REASONS = [
  { value: "inaccurate", label: "Inaccurate", description: "Doesn't accurately describe the product or feature." },
  { value: "missing", label: "Couldn't find what I was looking for", description: "Missing important information." },
  { value: "unclear", label: "Hard to understand", description: "Too complicated or unclear." },
  { value: "code", label: "Code sample errors", description: "One or more code samples are incorrect." },
  { value: "other", label: "Another reason", description: "" },
]

type Props = {
  pageTitle: string
  pageSlug: string
}

export function DocFeedback({ pageTitle, pageSlug }: Props) {
  const [step, setStep] = useState<Step>("idle")
  const [reason, setReason] = useState("")
  const [allowFollowUp, setAllowFollowUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleYes() {
    if (step === "yes") { setStep("idle"); setReason(""); return }
    setStep("yes")
    setReason("")
  }

  function handleNo() {
    if (step === "no") { setStep("idle"); setReason(""); return }
    setStep("no")
    setReason("")
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: step === "yes" ? "positive" : "negative",
          reason,
          allowFollowUp,
          pageTitle,
          pageSlug,
        }),
      })
    } finally {
      setStep(step === "yes" ? "yes-done" : "no-done")
      setSubmitting(false)
    }
  }

  const showPanel = step === "yes" || step === "no"
  const reasons = step === "yes" ? YES_REASONS : NO_REASONS
  const panelTitle = step === "yes" ? "What did you like?" : "What went wrong?"

  const yesActive = step === "yes" || step === "yes-done"
  const noActive = step === "no" || step === "no-done"
  const done = step === "yes-done" || step === "no-done"

  return (
    <div className="relative flex flex-col items-end gap-3">
      {showPanel && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 dark:bg-[#1a1d23] dark:border-gray-700 rounded-lg p-5 shadow-lg z-50">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{panelTitle}</p>
          <div className="flex flex-col gap-3">
            {reasons.map((r) => (
              <label key={r.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="feedback-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{r.label}</span>
                  {r.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowFollowUp}
                onChange={(e) => setAllowFollowUp(e.target.checked)}
                className="mt-0.5 accent-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Yes, it&apos;s okay to follow up by email.
              </span>
            </label>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="mt-4 w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-200 hover:enabled:text-gray-900 dark:text-gray-400 dark:bg-gray-800 dark:hover:enabled:bg-gray-700 dark:hover:enabled:text-white transition-colors"
          >
            {submitting ? "Sending…" : "Feedback"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {done && (
          <span className="text-sm text-gray-500 dark:text-gray-400">Thanks for your feedback!</span>
        )}
        {!done && <span className="text-sm text-gray-500 dark:text-gray-400">Was this page helpful?</span>}
        <button
          onClick={handleYes}
          disabled={done}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors disabled:cursor-default ${
            yesActive
              ? "bg-green-50 border-green-400 text-green-600 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400"
              : "border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <ThumbsUp size={14} strokeWidth={1.75} />
          Yes
        </button>
        <button
          onClick={handleNo}
          disabled={done}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors disabled:cursor-default ${
            noActive
              ? "bg-red-50 border-red-400 text-red-600 dark:bg-red-900/40 dark:border-red-700 dark:text-red-400"
              : "border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <ThumbsDown size={14} strokeWidth={1.75} />
          No
        </button>
      </div>
    </div>
  )
}
