import { Callout } from "./Callout"
import { Steps, Step } from "./Steps"
import { Tabs, Tab } from "./Tabs"
import { Icon } from "./Icon"
import { Details } from "./Details"
import { LLMOnly } from "./LLMOnly"
import { LLMIgnore } from "./LLMIgnore"
import { CodeBlock } from "@/components/Code/CodeBlock"

export const mdxComponents = {
  Callout,
  Steps,
  Step,
  Tabs,
  Tab,
  Icon,
  Details,
  LLMOnly,
  LLMIgnore,
  pre: ({ children }: { children: React.ReactNode }) => {
    // If the child code block has a language class, let CodeBlock handle it
    const child = children as React.ReactElement<{ className?: string }>
    if (child?.props?.className) return <>{children}</>
    // No language — render as a plain preformatted block
    const child2 = children as React.ReactElement<{ children: string }>
    return (
      <pre className="overflow-x-auto font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded-lg my-4 whitespace-pre leading-relaxed">
        {child2?.props?.children ?? children}
      </pre>
    )
  },
  code: ({ className, children }: { className?: string; children: string }) => {
    if (className) {
      return <CodeBlock className={className}>{children}</CodeBlock>
    }
    return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  },
}
