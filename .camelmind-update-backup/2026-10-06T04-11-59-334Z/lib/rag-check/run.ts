import { randomUUID } from "crypto"
import { getConfig } from "@/lib/config"
import { chunkMarkdownText } from "@/lib/rag-check/chunk"
import { generateQuestions } from "@/lib/rag-check/questions"
import { evaluateRetrieval, RETRIEVER_LABEL, SUMMARY_DISCLAIMER } from "@/lib/rag-check/retrieve"
import { runHeuristicEvaluation, SUMMARY_LABEL } from "@/lib/rag-check/heuristics"
import type { RagCheckRequest, RagCheckResponse } from "@/lib/rag-check/types"
import type { ResolvedDocPage } from "@/lib/author-tools/resolve-doc"

export function runRagCheck(
  doc: ResolvedDocPage,
  request: RagCheckRequest
): RagCheckResponse {
  const config = getConfig()
  const ragConfig = config.ai?.ragCheck
  const maxQuestions = ragConfig?.maxGeneratedQuestions ?? 12

  const chunks = chunkMarkdownText(doc.chunkText, {
    slug: doc.fullSlug,
    title: doc.frontmatter.title,
    chunkSize: request.chunkSize,
    chunkOverlap: request.chunkOverlap,
    lineOffset: doc.directiveLineOffset,
  })

  const questions =
    request.questions ??
    generateQuestions({
      slug: doc.fullSlug,
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      chunkText: doc.chunkText,
      chunks,
      maxQuestions,
    })

  const questionResults = questions.map((q) => evaluateRetrieval(q, chunks))
  const validSlugs = new Set(Object.values(doc.versionSlugs).flat())

  const { findings, summary } = runHeuristicEvaluation({
    aiText: doc.aiText,
    slug: doc.fullSlug,
    chunks,
    chunkSize: request.chunkSize,
    questionResults,
    validSlugs,
  })

  return {
    runId: randomUUID(),
    evaluator: "heuristic",
    scope: request.scope,
    retrieverLabel: RETRIEVER_LABEL,
    summaryDisclaimer: SUMMARY_DISCLAIMER,
    summaryLabel: SUMMARY_LABEL,
    summary,
    chunks,
    questions: questionResults,
    findings,
    aiText: doc.aiText,
  }
}
