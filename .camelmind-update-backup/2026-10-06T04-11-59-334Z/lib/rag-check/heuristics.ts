import { analyzeAiFriendliness, type AiViewIssue } from "@/lib/ai-view"
import type {
  RagCheckChunk,
  RagCheckFinding,
  RagCheckQuestionResult,
  RagCheckSeverity,
  RagCheckSummary,
} from "@/lib/rag-check/types"

const WEAK_PRONOUNS = new Set(["it", "this", "that", "these", "those", "they"])

const RECOMMENDATIONS: Record<string, string> = {
  "long-paragraph":
    "Split the paragraph under a descriptive subheading so each chunk carries its own context.",
  "context-less-table":
    "Add one sentence before the table that names what the rows compare.",
  "context-less-code":
    "Add a lead-in sentence describing what the code block does.",
  "weak-alt-text":
    "Replace generic alt text with a description of what the image shows.",
  "positional-reference":
    'Replace "above" or "below" with a named section or concept.',
  "weak-heading-context":
    "Rewrite the opening sentence to restate the section subject instead of using a pronoun.",
  "opaque-jsx":
    "Ensure each tab or step restates enough context to stand alone when concatenated.",
  "retrieval-miss":
    "Add exact terms users are likely to search for in the heading and first sentence.",
  "retrieval-noise":
    "Make the heading and first sentence more specific to this topic.",
  "long-chunk":
    "Split this section so each chunk stays under your target chunk size.",
  "over-split-section":
    "Merge related fragments or add bridging context so chunks are self-contained.",
  "weak-heading":
    "Rename the heading to include the product name or task being described.",
  "thin-answer-context":
    "Add a summary sentence that directly answers the likely user question.",
  "dead-link":
    "Fix or remove this link — it points to a slug that doesn't exist in the nav, a dead end for anyone (or any agent) who follows it.",
  "no-outbound-links":
    "Add a link to a related next step or prerequisite doc so an agent can continue the task instead of stopping here.",
  "same-page-anchor":
    "Confirm this anchor matches an actual heading ID on this page — RAG Check only validates page-to-page links, not in-page anchors.",
}

function mapAiViewSeverity(severity: AiViewIssue["severity"]): RagCheckSeverity {
  return severity === "warning" ? "warning" : "note"
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function aiViewToFindings(issues: AiViewIssue[], slug: string): RagCheckFinding[] {
  return issues.map((issue, idx) => ({
    id: `ai-view-${idx + 1}`,
    severity: mapAiViewSeverity(issue.severity),
    category: issue.category,
    message: issue.message,
    recommendation: RECOMMENDATIONS[issue.category] ?? "Revise this section for standalone readability.",
    slug,
    aiTextLine: issue.line,
  }))
}

function chunkFindings(chunks: RagCheckChunk[], slug: string, chunkSize: number): RagCheckFinding[] {
  const findings: RagCheckFinding[] = []

  for (const chunk of chunks) {
    if (chunk.tokenEstimate > chunkSize * 1.2) {
      findings.push({
        id: `long-chunk-${chunk.id}`,
        severity: "warning",
        category: "long-chunk",
        message: `Chunk ${chunk.id} is ~${chunk.tokenEstimate} tokens, above the ${chunkSize} token target.`,
        recommendation: RECOMMENDATIONS["long-chunk"],
        slug,
        chunkId: chunk.id,
        aiTextLine: chunk.startLine,
      })
    }

    const firstLine = chunk.text.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim()
    if (firstLine) {
      const firstWord = firstLine.split(/\s+/)[0]?.replace(/[.,;:]/g, "").toLowerCase()
      if (firstWord && WEAK_PRONOUNS.has(firstWord)) {
        findings.push({
          id: `weak-open-${chunk.id}`,
          severity: "note",
          category: "weak-heading-context",
          message: `Chunk opens with "${firstWord}" and may lack context when retrieved alone.`,
          recommendation: RECOMMENDATIONS["weak-heading-context"],
          slug,
          chunkId: chunk.id,
          aiTextLine: chunk.startLine,
        })
      }
    }

    if (chunk.headingPath.length > 0) {
      const heading = chunk.headingPath[chunk.headingPath.length - 1]
      if (heading.length < 12 || /^(overview|details|info|notes|summary)$/i.test(heading)) {
        findings.push({
          id: `weak-heading-${chunk.id}`,
          severity: "note",
          category: "weak-heading",
          message: `Heading "${heading}" may be too generic for retrieval.`,
          recommendation: RECOMMENDATIONS["weak-heading"],
          slug,
          chunkId: chunk.id,
          aiTextLine: chunk.startLine,
        })
      }
    }
  }

  // Near-duplicate chunks
  for (let i = 0; i < chunks.length; i++) {
    for (let j = i + 1; j < chunks.length; j++) {
      const a = chunks[i].text.slice(0, 200)
      const b = chunks[j].text.slice(0, 200)
      if (a.length > 50 && a === b) {
        findings.push({
          id: `dup-${chunks[i].id}-${chunks[j].id}`,
          severity: "warning",
          category: "over-split-section",
          message: "Two chunks share nearly identical opening content.",
          recommendation: RECOMMENDATIONS["over-split-section"],
          slug,
          chunkId: chunks[i].id,
          aiTextLine: chunks[i].startLine,
        })
      }
    }
  }

  return findings
}

function retrievalFindings(
  results: RagCheckQuestionResult[],
  slug: string
): RagCheckFinding[] {
  const findings: RagCheckFinding[] = []

  for (const result of results) {
    if (result.status === "fail") {
      findings.push({
        id: `miss-${result.question.id}`,
        severity: "blocking",
        category: "retrieval-miss",
        message: `Query "${result.question.question}" did not retrieve the expected chunk in top 5.`,
        recommendation: RECOMMENDATIONS["retrieval-miss"],
        slug,
        questionId: result.question.id,
      })
    } else if (result.status === "warning") {
      findings.push({
        id: `noise-${result.question.id}`,
        severity: "warning",
        category: "retrieval-noise",
        message: `Query "${result.question.question}": ${result.notes.join(" ")}`,
        recommendation: RECOMMENDATIONS["retrieval-noise"],
        slug,
        questionId: result.question.id,
      })
    }
  }

  return findings
}

const LINK_REGEX = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const ASSET_EXTENSION_REGEX = /\.[a-zA-Z0-9]{2,4}$/

function isInternalDocLink(href: string): boolean {
  if (/^https?:\/\//.test(href)) return false
  if (href.startsWith("/assets/")) return false
  const target = href.split("#")[0].split("?")[0]
  if (ASSET_EXTENSION_REGEX.test(target)) return false
  return true
}

function linkFindings(
  aiText: string,
  slug: string,
  chunkCount: number,
  validSlugs: Set<string>
): RagCheckFinding[] {
  const findings: RagCheckFinding[] = []
  const lines = aiText.split("\n")
  let internalLinkCount = 0

  lines.forEach((line, idx) => {
    LINK_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = LINK_REGEX.exec(line)) !== null) {
      const isImage = match[1] === "!"
      const linkText = match[2]
      const href = match[3]
      if (isImage) continue

      if (href.startsWith("#")) {
        findings.push({
          id: `same-page-anchor-${slug}-${idx}-${match.index}`,
          severity: "note",
          category: "same-page-anchor",
          message: `Link "${linkText}" points to the same-page anchor "${href}" — RAG Check can't verify it matches an actual heading here.`,
          recommendation: RECOMMENDATIONS["same-page-anchor"],
          slug,
          aiTextLine: idx + 1,
        })
        continue
      }

      if (!isInternalDocLink(href)) continue

      internalLinkCount++
      const target = href.split("#")[0].split("?")[0].replace(/\/$/, "")
      if (!validSlugs.has(target)) {
        findings.push({
          id: `dead-link-${slug}-${idx}-${match.index}`,
          severity: "blocking",
          category: "dead-link",
          message: `Link "${linkText}" points to "${href}", which isn't a valid page slug.`,
          recommendation: RECOMMENDATIONS["dead-link"],
          slug,
          aiTextLine: idx + 1,
        })
      }
    }
  })

  if (internalLinkCount === 0 && chunkCount > 1) {
    findings.push({
      id: `no-outbound-links-${slug}`,
      severity: "note",
      category: "no-outbound-links",
      message: "This page has no internal links to other docs.",
      recommendation: RECOMMENDATIONS["no-outbound-links"],
      slug,
    })
  }

  return findings
}

function scoreRetrievability(results: RagCheckQuestionResult[]): number {
  if (results.length === 0) return 100
  const withExpected = results.filter((r) => (r.question.expectedChunkIds?.length ?? 0) > 0)
  const pool = withExpected.length > 0 ? withExpected : results
  const top3Hits = pool.filter((r) => r.scores.top3 === 1).length
  const noise = pool.filter((r) => r.status === "warning" || r.status === "fail").length
  const base = (top3Hits / pool.length) * 100
  return clampScore(base - noise * 8)
}

function scoreChunkIndependence(chunks: RagCheckChunk[], chunkFindingsList: RagCheckFinding[]): number {
  if (chunks.length === 0) return 100
  const relevant = chunkFindingsList.filter((f) =>
    ["weak-heading-context", "over-split-section", "long-chunk", "weak-heading"].includes(f.category)
  )
  const penalty = relevant.reduce((sum, f) => sum + (f.severity === "warning" ? 12 : 6), 0)
  return clampScore(100 - penalty)
}

function scoreGrounding(aiFindings: RagCheckFinding[]): number {
  const groundingCategories = new Set([
    "context-less-table",
    "context-less-code",
    "positional-reference",
    "weak-alt-text",
    "thin-answer-context",
  ])
  const hits = aiFindings.filter((f) => groundingCategories.has(f.category)).length
  return clampScore(100 - hits * 15)
}

function scoreFormatRobustness(aiFindings: RagCheckFinding[], tokenCount: number): number {
  const warnings = aiFindings.filter((f) => f.severity !== "note").length
  const per1k = tokenCount > 0 ? (warnings / tokenCount) * 1000 : warnings
  return clampScore(100 - per1k * 20)
}

function scoreQueryCoverage(results: RagCheckQuestionResult[]): number {
  if (results.length === 0) return 100
  const top5 = results.filter((r) => r.scores.top5 === 1).length
  return clampScore((top5 / results.length) * 100)
}

function scoreCrossLinkQuality(linkFindingsList: RagCheckFinding[]): number {
  const deadLinks = linkFindingsList.filter((f) => f.category === "dead-link").length
  const orphanPenalty = linkFindingsList.some((f) => f.category === "no-outbound-links") ? 1 : 0
  return clampScore(100 - deadLinks * 20 - orphanPenalty * 10)
}

// Presence of any blocking finding caps overall regardless of the weighted average — a dead
// link or a failed retrieval test is an outright failure, not a proportional deduction.
const BLOCKING_OVERALL_CAP = 70

export function buildHeuristicSummary(
  results: RagCheckQuestionResult[],
  chunks: RagCheckChunk[],
  aiFindings: RagCheckFinding[],
  chunkFindingsList: RagCheckFinding[],
  linkFindingsList: RagCheckFinding[] = []
): RagCheckSummary {
  const retrievability = scoreRetrievability(results)
  const chunkIndependence = scoreChunkIndependence(chunks, chunkFindingsList)
  const groundingReadiness = scoreGrounding(aiFindings)
  const tokenCount = chunks.reduce((n, c) => n + c.tokenEstimate, 0)
  const formatRobustness = scoreFormatRobustness(aiFindings, tokenCount)
  const queryCoverage = scoreQueryCoverage(results)
  const crossLinkQuality = scoreCrossLinkQuality(linkFindingsList)

  const hasBlockingFinding =
    results.some((r) => r.status === "fail") || linkFindingsList.some((f) => f.severity === "blocking")

  const overall = clampScore(
    Math.min(
      hasBlockingFinding ? BLOCKING_OVERALL_CAP : 100,
      retrievability * 0.35 +
        chunkIndependence * 0.2 +
        groundingReadiness * 0.15 +
        formatRobustness * 0.15 +
        queryCoverage * 0.05 +
        crossLinkQuality * 0.1
    )
  )

  return {
    overall,
    retrievability,
    chunkIndependence,
    groundingReadiness,
    formatRobustness,
    queryCoverage,
    crossLinkQuality,
  }
}

export function runHeuristicEvaluation(opts: {
  aiText: string
  slug: string
  chunks: RagCheckChunk[]
  chunkSize: number
  questionResults: RagCheckQuestionResult[]
  validSlugs: Set<string>
}): { findings: RagCheckFinding[]; summary: RagCheckSummary } {
  const aiIssues = analyzeAiFriendliness(opts.aiText)
  const aiFindings = aiViewToFindings(aiIssues, opts.slug)
  const chunkFindingsList = chunkFindings(opts.chunks, opts.slug, opts.chunkSize)
  const retrievalFindingsList = retrievalFindings(opts.questionResults, opts.slug)
  const linkFindingsList = linkFindings(opts.aiText, opts.slug, opts.chunks.length, opts.validSlugs)

  const findings = [
    ...retrievalFindingsList,
    ...linkFindingsList,
    ...aiFindings,
    ...chunkFindingsList,
  ].sort((a, b) => {
    const order = { blocking: 0, warning: 1, note: 2 }
    return order[a.severity] - order[b.severity]
  })

  const summary = buildHeuristicSummary(
    opts.questionResults,
    opts.chunks,
    aiFindings,
    chunkFindingsList,
    linkFindingsList
  )

  return { findings, summary }
}

export const SUMMARY_LABEL = "Heuristic estimate"
