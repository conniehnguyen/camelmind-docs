import { PenLine, GitBranch, Map, Compass, Bot, Unlock, type LucideIcon } from "lucide-react"

export type Reason = {
  icon: LucideIcon
  title: string
  description: string
}

export const WHY_US_REASONS: Reason[] = [
  {
    icon: PenLine,
    title: "Technical writing experience",
    description: "We know how to turn complex products, APIs, workflows, and architecture into documentation that developers can actually follow.",
  },
  {
    icon: GitBranch,
    title: "Docs-as-code expertise",
    description: "We're comfortable working in Git-based workflows, Markdown and MDX, CI/CD, OpenAPI, versioning, navigation systems, and modern documentation platforms.",
  },
  {
    icon: Map,
    title: "Information architecture",
    description: "We don't just fill pages. We think about how information is organized, discovered, maintained, and reused.",
  },
  {
    icon: Compass,
    title: "Developer experience",
    description: "Documentation is part of your product experience. We approach it with the same care you'd apply to onboarding, UX, and developer tooling.",
  },
  {
    icon: Bot,
    title: "AI-ready documentation",
    description: "Modern documentation needs to work for more than a human reading a page. We structure content with search, retrieval, citations, and AI consumption in mind.",
  },
  {
    icon: Unlock,
    title: "Platform independent",
    description: "We built CamelMind, but we're not here to sell you a platform you don't need. If your existing stack works, we'll work with it. If it doesn't, we'll help you evaluate the alternatives.",
  },
]

export function WhyUs({ reasons }: { reasons: Reason[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {reasons.map((r) => (
        <div
          key={r.title}
          className="flex flex-col gap-3 p-6 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-bg-secondary)]"
        >
          <r.icon size={24} className="text-[var(--cm-oasis-teal)]" />
          <h4 className="text-base font-semibold text-[var(--cm-text-primary)]">{r.title}</h4>
          <p className="text-sm leading-relaxed text-[var(--cm-text-secondary)]">{r.description}</p>
        </div>
      ))}
    </div>
  )
}
