"use client"

import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  if (!mounted) return <div className="w-8 h-8" />

  const Icon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        <Icon size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {OPTIONS.map(({ value, label, Icon: ItemIcon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                theme === value
                  ? "text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <ItemIcon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
