import type { RagCheckChunk, RagCheckQuestion, RagCheckQuestionResult } from "@/lib/rag-check/types"

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during", "before",
  "after", "above", "below", "between", "out", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just", "and",
  "but", "if", "or", "because", "until", "while", "what", "which", "who",
  "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
  "my", "your", "his", "her", "its", "our", "their", "me", "him", "them", "us",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
}

function scoreChunk(question: string, chunk: RagCheckChunk): number {
  const qTokens = tokenize(question)
  if (qTokens.length === 0) return 0

  // The lead/intro chunk (before the page's first heading) has an empty
  // headingPath, so it gets none of the headingText bonus below — even though
  // it's usually the right answer to "What is <page title>?"-style questions.
  // Without this fallback, any subsection whose heading happens to repeat the
  // page's own topic words (extremely common) systematically outranks the
  // intro paragraph. chunk.title is otherwise identical across every chunk on
  // a page, so it's only useful here as this one chunk's implicit heading.
  const headingText = (
    chunk.headingPath.length > 0 ? chunk.headingPath.join(" ") : chunk.title
  ).toLowerCase()
  const bodyText = chunk.text.toLowerCase()
  const slugText = chunk.slug.replace(/\//g, " ").toLowerCase()

  let score = 0
  const phrase = question.toLowerCase()

  if (headingText && phrase.includes(headingText)) score += 8

  for (const token of qTokens) {
    if (headingText.includes(token)) score += 4
    if (slugText.includes(token)) score += 2
    const bodyMatches = (bodyText.match(new RegExp(`\\b${token}\\b`, "g")) ?? []).length
    score += Math.min(bodyMatches, 3)
  }

  if (bodyText.includes(phrase.slice(0, 40))) score += 5

  return score
}

export function retrieveChunks(
  question: RagCheckQuestion,
  chunks: RagCheckChunk[],
  k = 5
): RagCheckChunk[] {
  const ranked = [...chunks]
    .map((chunk) => ({ chunk, score: scoreChunk(question.question, chunk) }))
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, k).map((r) => r.chunk)
}

export function evaluateRetrieval(
  question: RagCheckQuestion,
  chunks: RagCheckChunk[],
  k = 5
): RagCheckQuestionResult {
  const retrieved = retrieveChunks(question, chunks, k)
  const retrievedIds = retrieved.map((c) => c.id)
  const expected = question.expectedChunkIds ?? []

  const rank = expected.length
    ? retrieved.findIndex((c) => expected.includes(c.id))
    : retrieved.length > 0
      ? 0
      : -1

  const top1 = rank === 0
  const top3 = rank >= 0 && rank < 3
  const top5 = rank >= 0 && rank < 5

  const noise =
    expected.length > 0 &&
    retrieved.length > 0 &&
    !expected.includes(retrieved[0].id)

  let status: RagCheckQuestionResult["status"] = "pass"
  const notes: string[] = []

  if (expected.length > 0 && !top5) {
    status = "fail"
    notes.push("Expected chunk not found in top 5 results.")
  } else if (expected.length > 0 && !top3) {
    status = "warning"
    notes.push("Expected chunk ranked below top 3.")
  } else if (noise) {
    status = "warning"
    notes.push("Unrelated chunk ranked above the expected chunk.")
  }

  return {
    question,
    retrievedChunkIds: retrievedIds,
    retrievedChunks: retrieved,
    scores: {
      top1: top1 ? 1 : 0,
      top3: top3 ? 1 : 0,
      top5: top5 ? 1 : 0,
      rank: rank >= 0 ? rank + 1 : 0,
    },
    status,
    notes,
  }
}

export const RETRIEVER_LABEL = "Keyword retriever (proxy)"

export const SUMMARY_DISCLAIMER =
  "Estimates keyword-based retrieval on this page's chunks. Embedding-based production RAG may rank differently."
