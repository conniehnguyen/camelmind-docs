import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { matterOptions } from "./mdx"

// Matches fenced code blocks OR a <Partial> tag — fences are captured so
// they can be passed through untouched, since a doc showing <Partial ... />
// as a literal syntax example inside ``` fences must not be resolved.
const FENCE_OR_PARTIAL_TAG = /(```[\s\S]*?```)|<Partial\s+file=["']([^"']+)["']\s*\/>/g
const MAX_DEPTH = 5

// Resolves <Partial file="_partials/foo.mdx" /> tags by splicing in the
// referenced file's content (recursively). `file` paths are relative to
// content/. Runs as string-level preprocessing, same approach as
// preprocessTabs — before the MDX compiler ever sees the source.
export function resolvePartials(source: string, seen: string[] = []): string {
  return source.replace(FENCE_OR_PARTIAL_TAG, (_match, fence: string | undefined, relPath: string) => {
    if (fence !== undefined) return fence

    const contentRoot = path.join(process.cwd(), "content")
    const fullPath = path.join(contentRoot, relPath)

    if (!fullPath.startsWith(contentRoot)) {
      throw new Error(`Partial path escapes content/: "${relPath}"`)
    }
    if (seen.includes(relPath)) {
      throw new Error(
        `Circular partial include detected: ${[...seen, relPath].join(" -> ")}`
      )
    }
    if (seen.length >= MAX_DEPTH) {
      throw new Error(
        `Partial include depth exceeded (max ${MAX_DEPTH}): ${[...seen, relPath].join(" -> ")}`
      )
    }
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Partial not found: "${relPath}" (resolved to ${fullPath})`)
    }

    const raw = fs.readFileSync(fullPath, "utf-8")
    const { content } = matter(raw, matterOptions)
    return resolvePartials(content.trim(), [...seen, relPath])
  })
}
