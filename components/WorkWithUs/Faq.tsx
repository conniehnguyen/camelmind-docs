"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

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
              className="w-full grid grid-cols-[1fr_24px] items-center gap-4 py-5 text-left"
            >
              <span className="text-base font-medium text-[var(--cm-text-primary)]">{item.q}</span>
              <ChevronDown
                size={18}
                className={`justify-self-end text-[var(--cm-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="pb-5 text-[15px] leading-relaxed text-[var(--cm-text-secondary)]">
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
