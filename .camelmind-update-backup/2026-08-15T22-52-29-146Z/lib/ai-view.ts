// Heuristic scan of the exact text an AI/RAG pipeline ingests for a page
// (the same string produced by processForLLM() and served at /api/llms/[...slug]).
// Flags formatting that tends to lose meaning once split into retrieval chunks.

export type AiViewIssue = {
  line: number
  severity: "warning" | "info"
  category: string
  message: string
  excerpt: string
}

const POSITIONAL_PHRASES = [
  "as shown above",
  "as shown below",
  "as mentioned above",
  "as mentioned below",
  "as discussed above",
  "as discussed below",
  "see above",
  "see below",
  "in the previous section",
  "in the next section",
  "in the section above",
  "in the section below",
  "the following steps",
  "as previously mentioned",
]

const WEAK_PRONOUNS = new Set(["it", "this", "that", "these", "those", "they"])

const GENERIC_ALT_WORDS = new Set(["image", "screenshot", "diagram", "photo", "picture", "img"])

const PARAGRAPH_WORD_THRESHOLD = 120

export function analyzeAiFriendliness(aiText: string): AiViewIssue[] {
  const issues: AiViewIssue[] = []
  const lines = aiText.split("\n")

  let inCodeFence = false
  let lastMeaningfulWasHeading = false
  let seenJsxBlock = false
  let paragraphLines: string[] = []
  let paragraphStartLine = 0

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const wordCount = paragraphLines.join(" ").split(/\s+/).filter(Boolean).length
    if (wordCount > PARAGRAPH_WORD_THRESHOLD) {
      issues.push({
        line: paragraphStartLine,
        severity: "warning",
        category: "long-paragraph",
        message: `Paragraph is ${wordCount} words with no heading/list break — likely to be split across retrieval chunks, losing context.`,
        excerpt: paragraphLines[0].slice(0, 100),
      })
    }
    paragraphLines = []
  }

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1
    const line = rawLine.trim()

    if (line.startsWith("```")) {
      if (!inCodeFence && lastMeaningfulWasHeading) {
        issues.push({
          line: lineNo,
          severity: "warning",
          category: "context-less-code",
          message: "Code block appears immediately after a heading with no lead-in sentence explaining it.",
          excerpt: line.slice(0, 100),
        })
      }
      flushParagraph()
      inCodeFence = !inCodeFence
      lastMeaningfulWasHeading = false
      return
    }
    if (inCodeFence) return

    if (line === "") {
      flushParagraph()
      return
    }

    if (/^#{1,6}\s+.+$/.test(line)) {
      flushParagraph()
      lastMeaningfulWasHeading = true
      return
    }

    if (line.startsWith("|") && lastMeaningfulWasHeading) {
      issues.push({
        line: lineNo,
        severity: "warning",
        category: "context-less-table",
        message: "Table appears immediately after a heading with no lead-in sentence — a chunk containing just this table loses what it's describing.",
        excerpt: line.slice(0, 100),
      })
    }

    const imgRegex = /!\[([^\]]*)\]\(([^)]*)\)/g
    let imgMatch: RegExpExecArray | null
    while ((imgMatch = imgRegex.exec(line)) !== null) {
      const alt = imgMatch[1].trim().toLowerCase()
      if (!alt || GENERIC_ALT_WORDS.has(alt)) {
        issues.push({
          line: lineNo,
          severity: "warning",
          category: "weak-alt-text",
          message: alt
            ? `Image alt text ("${alt}") is too generic to convey what the image shows.`
            : "Image has no alt text — an AI reading this page has no idea what the image contains.",
          excerpt: line.slice(0, 100),
        })
      }
    }

    if (lastMeaningfulWasHeading) {
      const firstWord = line.split(/\s+/)[0]?.replace(/[.,;:]/g, "").toLowerCase()
      if (firstWord && WEAK_PRONOUNS.has(firstWord)) {
        issues.push({
          line: lineNo,
          severity: "info",
          category: "weak-heading-context",
          message: `Section opens with "${firstWord}" instead of restating its subject — if this chunk is retrieved on its own, the pronoun has nothing to refer to.`,
          excerpt: line.slice(0, 100),
        })
      }
    }
    lastMeaningfulWasHeading = false

    const lowerLine = line.toLowerCase()
    for (const phrase of POSITIONAL_PHRASES) {
      if (lowerLine.includes(phrase)) {
        issues.push({
          line: lineNo,
          severity: "warning",
          category: "positional-reference",
          message: `Relies on visual position ("${phrase}") that won't survive being split into a retrieval chunk.`,
          excerpt: line.slice(0, 100),
        })
      }
    }

    if (!seenJsxBlock && /<(Tabs|Steps)\b/.test(line)) {
      seenJsxBlock = true
      issues.push({
        line: lineNo,
        severity: "info",
        category: "opaque-jsx",
        message: "Raw <Tabs>/<Steps> component tags are what an AI actually ingests here — make sure each tab/step restates enough context to stand alone, since they'll appear concatenated with no visual boundary.",
        excerpt: line.slice(0, 100),
      })
    }

    if (!line.startsWith("<") && !/^[-*]\s/.test(line) && !/^\d+\.\s/.test(line)) {
      if (paragraphLines.length === 0) paragraphStartLine = lineNo
      paragraphLines.push(line)
    } else {
      flushParagraph()
    }
  })
  flushParagraph()

  return issues
}
