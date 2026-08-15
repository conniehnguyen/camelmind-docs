import { Clock } from "lucide-react"

type Props = {
  date: Date
  author?: string | null
}

export function LastUpdated({ date, author }: Props) {
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <Clock size={14} strokeWidth={1.75} />
      <span>
        {author ? `Last updated by ${author} on ${formatted}` : formatted}
      </span>
    </div>
  )
}
