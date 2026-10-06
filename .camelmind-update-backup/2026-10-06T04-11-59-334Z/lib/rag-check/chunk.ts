export function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.33)
}

type Section = {
  headingPath: string[]
  lines: string[]
  startLine: number
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n")
  const sections: Section[] = []
  let headingPath: string[] = []
  let currentLines: string[] = []
  let sectionStart = 1

  const flush = (endLine: number) => {
    if (currentLines.length === 0) return
    sections.push({
      headingPath: [...headingPath],
      lines: [...currentLines],
      startLine: sectionStart,
    })
    currentLines = []
    sectionStart = endLine + 1
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)

    if (headingMatch) {
      flush(lineNo - 1)
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()
      headingPath = headingPath.slice(0, level - 1)
      headingPath[level - 1] = title
      headingPath = headingPath.slice(0, level)
      sectionStart = lineNo
      currentLines.push(line)
      continue
    }

    if (currentLines.length === 0) sectionStart = lineNo
    currentLines.push(line)
  }

  flush(lines.length)
  return sections
}

function splitSectionByTokens(
  section: Section,
  chunkSize: number,
  chunkOverlap: number
): Array<{ lines: string[]; startLine: number; endLine: number; headingPath: string[] }> {
  const text = section.lines.join("\n")
  const tokens = estimateTokens(text)
  if (tokens <= chunkSize) {
    return [
      {
        lines: section.lines,
        startLine: section.startLine,
        endLine: section.startLine + section.lines.length - 1,
        headingPath: section.headingPath,
      },
    ]
  }

  const parts: Array<{ lines: string[]; startLine: number; endLine: number; headingPath: string[] }> = []
  let buffer: string[] = []
  let bufferStart = section.startLine

  const flushBuffer = (endLine: number) => {
    if (buffer.length === 0) return
    parts.push({
      lines: [...buffer],
      startLine: bufferStart,
      endLine: endLine,
      headingPath: section.headingPath,
    })
  }

  for (let i = 0; i < section.lines.length; i++) {
    const line = section.lines[i]
    const lineNo = section.startLine + i
    const candidate = [...buffer, line]
    if (buffer.length > 0 && estimateTokens(candidate.join("\n")) > chunkSize) {
      flushBuffer(lineNo - 1)
      const overlapLines = chunkOverlap > 0 ? takeOverlapLines(buffer, chunkOverlap) : []
      buffer = [...overlapLines, line]
      bufferStart = lineNo - overlapLines.length
    } else {
      if (buffer.length === 0) bufferStart = lineNo
      buffer.push(line)
    }
  }

  flushBuffer(section.startLine + section.lines.length - 1)
  return parts
}

function takeOverlapLines(lines: string[], overlapTokens: number): string[] {
  const result: string[] = []
  let tokens = 0
  for (let i = lines.length - 1; i >= 0; i--) {
    const lineTokens = estimateTokens(lines[i])
    if (tokens + lineTokens > overlapTokens && result.length > 0) break
    result.unshift(lines[i])
    tokens += lineTokens
  }
  return result
}

export function chunkMarkdownText(
  chunkText: string,
  opts: {
    slug: string
    title: string
    chunkSize: number
    chunkOverlap: number
    lineOffset?: number
  }
): Array<{
  id: string
  slug: string
  title: string
  text: string
  startLine: number
  endLine: number
  headingPath: string[]
  tokenEstimate: number
}> {
  const { slug, title, chunkSize, chunkOverlap, lineOffset = 0 } = opts
  const sections = splitIntoSections(chunkText)
  const rawParts = sections.flatMap((s) => splitSectionByTokens(s, chunkSize, chunkOverlap))

  return rawParts.map((part, idx) => {
    const text = part.lines.join("\n").trim()
    return {
      id: `${slug}#chunk-${idx + 1}`,
      slug,
      title,
      text,
      startLine: part.startLine + lineOffset,
      endLine: part.endLine + lineOffset,
      headingPath: part.headingPath,
      tokenEstimate: estimateTokens(text),
    }
  }).filter((c) => c.text.length > 0)
}
