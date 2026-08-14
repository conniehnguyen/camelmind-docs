import type { HttpMethod } from "@/lib/api-types"

const METHOD_STYLES: Record<string, string> = {
  get:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  post:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  put:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  patch:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  delete:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  head:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  options: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

type Props = {
  method: HttpMethod
  size?: "sm" | "md"
}

export function MethodBadge({ method, size = "md" }: Props) {
  const styles = METHOD_STYLES[method] ?? METHOD_STYLES.get
  const sizeClass = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 min-w-[38px]"
    : "text-xs px-2 py-1 min-w-[46px]"

  return (
    <span className={`inline-flex items-center justify-center rounded font-mono font-bold uppercase tracking-wide shrink-0 ${sizeClass} ${styles}`}>
      {method}
    </span>
  )
}
