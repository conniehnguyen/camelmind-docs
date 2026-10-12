"use client"

import { useState } from "react"
import { Mail } from "lucide-react"

const PROJECT_TYPES = [
  { value: "build", label: "Documentation strategy & build" },
  { value: "migration", label: "Documentation migration" },
  { value: "retainer", label: "Documentation partnership" },
  { value: "not-sure", label: "Not sure yet" },
]

type Status = "idle" | "open" | "sending" | "sent" | "error"
type Tone = "onLight" | "onDark"

export function WorkWithUs({ tone = "onLight", ctaLabel = "Get in touch" }: { tone?: Tone; ctaLabel?: string }) {
  const [status, setStatus] = useState<Status>("idle")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0].value)
  const [message, setMessage] = useState("")

  const open = status === "open" || status === "sending" || status === "error"

  function toggle() {
    setStatus(open ? "idle" : "open")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/work-with-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          projectType,
          message: message.trim(),
        }),
      })
      if (!res.ok) throw new Error("request failed")
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="relative flex flex-col items-start gap-3 not-prose my-6">
      {open && (
        <div className="w-full max-w-md bg-white border border-gray-200 dark:bg-[#1a1d23] dark:border-gray-700 rounded-lg p-5 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tell us about your project</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A few sentences about what you need"
              rows={4}
              className="resize-none rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {status === "error" && (
              <p className="text-xs text-red-500">Something went wrong sending your message. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-1 w-full py-2 text-sm font-medium text-white bg-[var(--cm-oasis-teal)] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90 transition-opacity"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-3">
        {status === "sent" ? (
          <span className={`text-sm ${tone === "onDark" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
            Thanks — we&apos;ll be in touch within one business day.
          </span>
        ) : tone === "onDark" ? (
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold bg-[var(--cm-oasis-teal)] text-white hover:opacity-90 transition-opacity"
          >
            <Mail size={14} strokeWidth={1.75} />
            {open ? "Close" : ctaLabel}
          </button>
        ) : (
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-white transition-colors"
          >
            <Mail size={14} strokeWidth={1.75} />
            {open ? "Close" : ctaLabel}
          </button>
        )}
      </div>
    </div>
  )
}
