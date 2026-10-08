"use client"

import { useState } from "react"

export type FaqItem = { q: string; a: string }

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className="border-b border-[var(--cm-border)]">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full grid grid-cols-[40px_1fr_24px] items-center gap-4 py-5 text-left"
            >
              <span className="font-mono text-[11px] font-medium text-[var(--cm-oasis-teal)]">
                Q.{String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-base font-medium text-[var(--cm-text-primary)]">{item.q}</span>
              <span
                className={`text-lg text-[var(--cm-text-muted)] text-right transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="pb-5 pl-[56px] text-[15px] leading-relaxed text-[var(--cm-text-secondary)]">
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
