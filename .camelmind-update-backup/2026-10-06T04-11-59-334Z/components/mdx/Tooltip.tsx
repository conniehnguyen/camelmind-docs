"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const anchor = anchorRef.current

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect()
      const placement = rect.top < 100 ? "bottom" : "top"
      setPos({
        top: placement === "top" ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placement,
      })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open])

  return (
    <span
      ref={anchorRef}
      className="relative inline-block border-b border-dotted border-gray-400 dark:border-gray-600 cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && pos &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: `translate(-50%, ${pos.placement === "top" ? "-100%" : "0"})`,
            }}
            className="z-[100] w-64 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300 shadow-lg"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}
