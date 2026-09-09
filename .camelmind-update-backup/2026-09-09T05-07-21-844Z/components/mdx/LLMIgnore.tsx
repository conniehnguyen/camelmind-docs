// Renders normally for humans — stripped from .md responses served to LLMs.
export function LLMIgnore({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
