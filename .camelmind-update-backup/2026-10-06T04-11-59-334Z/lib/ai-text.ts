import { processForLLM } from "@/lib/mdx"
import type { CamelMindConfig } from "@/lib/config-types"

export function getLlmsDirective(config: CamelMindConfig): string {
  const baseUrl = config.url.replace(/\/$/, "")
  return (
    config.ai?.llmsTxt?.directive ??
    `For a complete documentation index, see ${baseUrl}/llms.txt. To read any public page as Markdown, append .md to the URL.`
  )
}

/** LLM/RAG ingestion string; matches `/api/llms/[...slug]` output. */
export function buildAiReadableText(rawSource: string, config: CamelMindConfig): string {
  const directive = getLlmsDirective(config)
  const chunkText = processForLLM(rawSource)
  return `> ${directive}\n\n${chunkText}`
}

/** Body text used for chunking and retrieval (directive excluded). */
export function buildChunkText(rawSource: string): string {
  return processForLLM(rawSource)
}

/** Lines in aiText before chunkText begins (for aiTextLine mapping). */
export function getDirectiveLineOffset(aiText: string, chunkText: string): number {
  const idx = aiText.indexOf(chunkText)
  if (idx <= 0) return 0
  return aiText.slice(0, idx).split("\n").length - 1
}
