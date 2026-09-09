"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useTheme } from "next-themes"

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = `mermaid-${rawId}`
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    let cancelled = false

    import("mermaid").then(async ({ default: mermaid }) => {
      // Re-read on every render so light/dark toggling re-themes the diagram.
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          background: cssVar("--cm-bg-secondary"),
          primaryColor: cssVar("--cm-bg-tertiary"),
          primaryTextColor: cssVar("--cm-text-primary"),
          primaryBorderColor: cssVar("--cm-border"),
          lineColor: cssVar("--cm-primary"),
          secondaryColor: cssVar("--cm-bg-tertiary"),
          tertiaryColor: cssVar("--cm-bg-primary"),
          fontFamily: cssVar("--cm-font-body") || "inherit",
          fontSize: "14px",
        },
      })

      try {
        const { svg: rendered } = await mermaid.render(id, chart.trim())
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null)
          setError(err instanceof Error ? err.message : "Failed to render diagram")
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [chart, id, resolvedTheme])

  if (error) {
    return (
      <pre className="my-4 p-4 rounded-lg border border-[var(--cm-danger-border)] bg-[var(--cm-danger-bg)] text-sm text-[var(--cm-danger-icon)] overflow-x-auto">
        Mermaid diagram failed to render: {error}
      </pre>
    )
  }

  if (!svg) {
    return <div className="my-6 h-32 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-bg-tertiary)] animate-pulse" />
  }

  return (
    <div
      ref={ref}
      onClick={() => setZoomed((z) => !z)}
      className={`mermaid-diagram my-6 flex justify-center overflow-x-auto rounded-lg border border-[var(--cm-border)] bg-[var(--cm-bg-secondary)] p-4${zoomed ? " zoomed" : ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
