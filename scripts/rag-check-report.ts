/**
 * rag-check-report — batch-runs RAG Check's heuristic scoring across every doc in the
 * default nav and prints the lowest scorers with their findings.
 *
 * Diagnostic only, not wired into CI or package.json. Reuses the same scoring pipeline
 * as lib/rag-check/run.ts (chunk -> generate questions -> retrieve -> score) but skips
 * the auth/session resolution in resolve-doc.ts, since this runs offline.
 *
 * Ported from helpcenter-v2 (same-purpose internal doc tool); see rag-benchmark/IMPLEMENTATION.mdx
 * for provenance notes on this port.
 *
 * Usage: npx tsx scripts/rag-check-report.ts [threshold]
 *   threshold — print docs with overall <= this value (default 89)
 */

import { loadNav, getSlugsFromConfig, getEntryBySlugFromConfig } from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { getConfig } from "@/lib/config"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { buildAiReadableText, buildChunkText, getDirectiveLineOffset } from "@/lib/ai-text"
import { chunkMarkdownText } from "@/lib/rag-check/chunk"
import { generateQuestions } from "@/lib/rag-check/questions"
import { evaluateRetrieval } from "@/lib/rag-check/retrieve"
import { runHeuristicEvaluation } from "@/lib/rag-check/heuristics"
import type { RagCheckSummary, RagCheckFinding } from "@/lib/rag-check/types"

const threshold = Number(process.argv[2] ?? 89)

const config = getConfig()
const ragConfig = config.ai?.ragCheck
const maxQuestions = ragConfig?.maxGeneratedQuestions ?? 12
const chunkSize = ragConfig?.defaultChunkSize ?? 500
const chunkOverlap = ragConfig?.defaultChunkOverlap ?? 80

const nav = loadNav()
const slugs = [...new Set(getSlugsFromConfig(nav))]
// Mirror resolve-doc.ts: dead-link checks validate against every version's slugs, not
// just the unversioned default nav (which strips the version-prefix docs actually link to).
const { versions } = loadVersions()
const validSlugs = new Set(versions.flatMap((v) => getSlugsFromConfig(getNavForVersion(v.id))))

type Row = { slug: string; title: string; summary: RagCheckSummary; findings: RagCheckFinding[] }
const rows: Row[] = []
const skipped: string[] = []

for (const slug of slugs) {
  const entry = getEntryBySlugFromConfig(nav, slug)
  if (!entry || !entry.file) {
    skipped.push(slug)
    continue
  }

  let source: string
  let frontmatter: { title?: string; description?: string }
  try {
    ;({ frontmatter, source } = loadMdxFile(entry.file))
  } catch (err) {
    skipped.push(`${slug} (load error: ${(err as Error).message})`)
    continue
  }

  const aiText = buildAiReadableText(source, config)
  const chunkText = buildChunkText(source)
  const lineOffset = getDirectiveLineOffset(aiText, chunkText)

  const chunks = chunkMarkdownText(chunkText, {
    slug,
    title: frontmatter.title ?? slug,
    chunkSize,
    chunkOverlap,
    lineOffset,
  })

  const questions = generateQuestions({
    slug,
    title: frontmatter.title ?? slug,
    description: frontmatter.description,
    chunkText,
    chunks,
    maxQuestions,
  })

  const questionResults = questions.map((q) => evaluateRetrieval(q, chunks))

  const { findings, summary } = runHeuristicEvaluation({
    aiText,
    slug,
    chunks,
    chunkSize,
    questionResults,
    validSlugs,
  })

  rows.push({ slug, title: frontmatter.title ?? slug, summary, findings })
}

rows.sort((a, b) => a.summary.overall - b.summary.overall)

console.log(`Scored ${rows.length} docs (${skipped.length} skipped: no .file entry or load error).\n`)

const flagged = rows.filter((r) => r.summary.overall <= threshold)
console.log(`${flagged.length} docs scoring <= ${threshold}:\n`)

for (const row of flagged) {
  const s = row.summary
  const dims: [string, number][] = [
    ["retrievability", s.retrievability],
    ["chunkIndependence", s.chunkIndependence],
    ["groundingReadiness", s.groundingReadiness],
    ["formatRobustness", s.formatRobustness],
    ["queryCoverage", s.queryCoverage],
    ["crossLinkQuality", s.crossLinkQuality],
  ]
  dims.sort((a, b) => a[1] - b[1])
  const weakest = dims.slice(0, 2).map(([name, val]) => `${name}=${val}`).join(", ")

  console.log(`--- ${row.slug} (${row.title}) — overall ${s.overall} — weakest: ${weakest}`)
  const topFindings = row.findings.slice(0, 5)
  for (const f of topFindings) {
    console.log(`    [${f.severity}] ${f.category}: ${f.message}`)
  }
  if (row.findings.length > topFindings.length) {
    console.log(`    ...and ${row.findings.length - topFindings.length} more findings`)
  }
  console.log()
}
