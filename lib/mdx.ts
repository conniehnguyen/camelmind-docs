import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import matter from "gray-matter"

export type FrontMatter = {
  title: string
  description?: string
  roles?: string[]
  tags?: string[]
  download_pdf?: string
  last_updated?: string
}

export type TocEntry = {
  id: string
  text: string
  level: number
}

export type DocContent = {
  frontmatter: FrontMatter
  source: string
  toc: TocEntry[]
  lastUpdated: Date | null
  lastUpdatedAuthor: string | null
}

function extractToc(source: string): TocEntry[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const entries: TocEntry[] = []
  let match

  while ((match = headingRegex.exec(source)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
    entries.push({ id, text, level })
  }

  return entries
}

export function processForLLM(source: string): string {
  let result = source.replace(/<LLMIgnore>[\s\S]*?<\/LLMIgnore>/g, "")
  result = result.replace(/<LLMOnly>([\s\S]*?)<\/LLMOnly>/g, "$1")
  return result.replace(/\n{3,}/g, "\n\n").trim()
}

export function loadFrontmatterOnly(filePath: string): FrontMatter {
  const fullPath = path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data } = matter(raw)
  return data as FrontMatter
}

export function loadMdxFile(filePath: string): DocContent {
  const fullPath = path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw)
  const frontmatter = data as FrontMatter

  let lastUpdated: Date | null = null
  if (frontmatter.last_updated) {
    const parsed = new Date(frontmatter.last_updated)
    if (!isNaN(parsed.getTime())) lastUpdated = parsed
  } else {
    lastUpdated = fs.statSync(fullPath).mtime
  }

  let lastUpdatedAuthor: string | null = null
  try {
    const result = execSync(`git log -1 --format="%an" -- "${fullPath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()
    if (result) lastUpdatedAuthor = result
  } catch {
    // not a git repo or git unavailable
  }

  return {
    frontmatter,
    source: content,
    toc: extractToc(content),
    lastUpdated,
    lastUpdatedAuthor,
  }
}
