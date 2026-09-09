import * as LucideIcons from "lucide-react"

type Props = {
  name: string
  size?: number
  className?: string
  color?: string
}

export function Icon({ name, size = 18, className, color }: Props) {
  // Convert kebab-case to PascalCase: "shield-alert" → "ShieldAlert"
  const pascalName = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")

  const LucideIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[pascalName]

  if (!LucideIcon) {
    console.warn(`Icon "${name}" (${pascalName}) not found in lucide-react`)
    return null
  }

  return <LucideIcon size={size} className={className} color={color} />
}
