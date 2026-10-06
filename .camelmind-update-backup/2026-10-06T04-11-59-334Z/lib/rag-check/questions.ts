import type { RagCheckChunk, RagCheckQuestion } from "@/lib/rag-check/types"

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function extractHeadings(chunkText: string): string[] {
  const headings: string[] = []
  for (const line of chunkText.split("\n")) {
    const m = line.match(/^#{1,6}\s+(.+)$/)
    if (m) headings.push(m[1].trim())
  }
  return headings
}

function headingToQuestion(heading: string, title: string): string | null {
  const lower = heading.toLowerCase()
  if (lower === title.toLowerCase()) return null
  if (/^(overview|introduction|summary|see also|related)$/i.test(lower)) return null

  if (/^(how to|installing|configure|setup|using|creating|running)\b/i.test(heading)) {
    return heading.endsWith("?") ? heading : `${heading.replace(/\.$/, "")}?`
  }
  if (heading.endsWith("?")) return heading
  if (/^(what|how|why|when|where|which)\b/i.test(heading)) {
    return heading.endsWith("?") ? heading : `${heading}?`
  }
  return `What does the "${heading}" section cover on ${title}?`
}

export function generateQuestions(
  opts: {
    slug: string
    title: string
    description?: string
    chunkText: string
    chunks: RagCheckChunk[]
    maxQuestions: number
  }
): RagCheckQuestion[] {
  const { slug, title, description, chunkText, chunks, maxQuestions } = opts
  const seed = hashString(`${slug}:${chunkText}`)
  const questions: RagCheckQuestion[] = []
  const seen = new Set<string>()

  const add = (question: string, expectedChunkIds?: string[]) => {
    const normalized = question.trim().toLowerCase()
    if (!normalized || seen.has(normalized) || questions.length >= maxQuestions) return
    seen.add(normalized)
    questions.push({
      id: `q-${questions.length + 1}`,
      question: question.trim(),
      expectedSlug: slug,
      expectedChunkIds,
      source: "generated",
    })
  }

  if (description && description.length > 20) {
    const chunkId = chunks[0]?.id
    add(`What is ${title}?`, chunkId ? [chunkId] : undefined)
  }

  const headings = extractHeadings(chunkText)
  for (const heading of headings) {
    const q = headingToQuestion(heading, title)
    if (!q) continue
    const match = chunks.find(
      (c) => c.headingPath.includes(heading) || c.text.includes(heading)
    )
    add(q, match ? [match.id] : undefined)
  }

  add(`How do I use ${title}?`, chunks[0]?.id ? [chunks[0].id] : undefined)

  // Deterministic shuffle based on seed
  const ordered = [...questions]
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = (seed + i * 2654435761) % (i + 1)
    ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
  }

  return ordered.slice(0, maxQuestions)
}
