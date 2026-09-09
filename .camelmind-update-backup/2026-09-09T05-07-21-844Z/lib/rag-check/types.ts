export type RagCheckSeverity = "blocking" | "warning" | "note"

export type RagCheckChunk = {
  id: string
  slug: string
  title: string
  text: string
  startLine: number
  endLine: number
  headingPath: string[]
  tokenEstimate: number
}

export type RagCheckQuestion = {
  id: string
  question: string
  expectedSlug: string
  expectedChunkIds?: string[]
  referenceAnswer?: string
  source: "generated" | "user"
}

export type RagCheckQuestionResult = {
  question: RagCheckQuestion
  retrievedChunkIds: string[]
  retrievedChunks: RagCheckChunk[]
  scores: Record<string, number>
  status: "pass" | "warning" | "fail"
  notes: string[]
}

export type RagCheckFinding = {
  id: string
  severity: RagCheckSeverity
  category: string
  message: string
  recommendation: string
  slug: string
  aiTextLine?: number
  sourceLine?: number
  chunkId?: string
  questionId?: string
}

export type RagCheckSummary = {
  overall: number
  retrievability: number
  chunkIndependence: number
  groundingReadiness: number
  formatRobustness: number
  queryCoverage: number
  crossLinkQuality: number
}

export type RagCheckRequest = {
  slug: string
  scope: "page"
  chunkSize: number
  chunkOverlap: number
  evaluator: "heuristic"
  questions?: RagCheckQuestion[]
}

export type RagCheckResponse = {
  runId: string
  evaluator: "heuristic"
  scope: string
  retrieverLabel: string
  summaryDisclaimer: string
  summaryLabel: string
  summary: RagCheckSummary
  chunks: RagCheckChunk[]
  questions: RagCheckQuestionResult[]
  findings: RagCheckFinding[]
  aiText: string
}
