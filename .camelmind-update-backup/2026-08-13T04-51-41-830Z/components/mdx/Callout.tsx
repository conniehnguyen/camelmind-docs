import { Icon } from "./Icon"

type CalloutType = "tip" | "warning" | "important" | "note" | "danger" | "success"

const labels: Record<CalloutType, string> = {
  tip:       "Tip",
  warning:   "Warning",
  important: "Important",
  note:      "Note",
  danger:    "Danger",
  success:   "Success",
}

const defaultIcons: Record<CalloutType, string> = {
  tip:       "lightbulb",
  warning:   "triangle-alert",
  important: "info",
  note:      "notebook-pen",
  danger:    "circle-x",
  success:   "circle-check",
}

export function Callout({
  type = "note",
  icon,
  title,
  children,
}: {
  type?: CalloutType
  icon?: string
  title?: string
  children: React.ReactNode
}) {
  const iconName = icon ?? defaultIcons[type]

  return (
    <div className={`callout ${type} my-4`}>
      <div className="callout-header flex items-center gap-1.5">
        <Icon name={iconName} size={13} />
        {title ?? labels[type]}
      </div>
      <div className="callout-body">{children}</div>
    </div>
  )
}
