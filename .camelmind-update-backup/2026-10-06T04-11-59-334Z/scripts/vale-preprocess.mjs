#!/usr/bin/env node
/**
 * Preprocess .mdx files for Vale, then run vale against the transformed copy.
 *
 * Vale has no native .mdx parser — it shells out to `mdx2vast` per its
 * "<ext>2vast" external-command convention (https://vale.sh/docs/formats/mdx).
 * mdx2vast treats ANY custom JSX flow component (<Steps>, <Step>, <Callout>,
 * <Details>, <Tabs>, <Tab>, <LLMOnly>, <LLMIgnore> — see
 * components/mdx/index.tsx) as opaque: it dumps the component's entire
 * source, children included, into a single `<pre><code>` block instead of
 * descending into it (see mdx2vast/bin/lib.js's customHandler — it slices
 * the raw source for any mdxJsxFlowElement node and wraps it whole, with no
 * recursion). Vale's prose rules correctly skip code blocks, so this makes
 * Vale blind to essentially every numbered step, callout, FAQ entry, and tab
 * body in the docs — the bulk of the actual instructional prose. There's no
 * .vale.ini setting to hook a preprocessing step into mdx2vast's invocation,
 * so this has to happen before Vale ever sees the file. (Ported from the
 * same fix in the helpcenter-v2 sibling repo.)
 *
 * This script strips those wrapper tags (promoting Step/Details/Tab titles
 * to real headings so their text still gets checked, since that text is
 * itself real prose) before mdx2vast ever sees the file, then invokes
 * `vale` against the transformed mirror under .vale-tmp/. It rewrites the
 * temp-dir prefix back out of the results so reported paths still read as
 * `content/...`, matching the real file.
 *
 * Usage:
 *   node scripts/vale-preprocess.mjs                      # lint all of content/
 *   node scripts/vale-preprocess.mjs content/foo/bar.mdx   # lint one file
 *   node scripts/vale-preprocess.mjs --output=JSON         # flags pass through to vale
 */

import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

const CONTENT_DIR = path.resolve(process.cwd(), "content")
const TMP_DIR = path.resolve(process.cwd(), ".vale-tmp")

// These always sit alone on their own line — MDX requires a blank line
// around a flow-level JSX block, so this is a language rule, not just a
// style convention, and it's safe to match line-for-line without touching
// anything else on the line.
const BLANK_LINE_TAGS = new Set([
  "<Steps>",
  "</Steps>",
  "</Step>",
  "</Callout>",
  "</Details>",
  "<Tabs>",
  "</Tabs>",
  "</Tab>",
  "</LLMOnly>",
  "</LLMIgnore>",
])

// Opening tags with no title-like attribute worth promoting — just blanked.
const BLANK_ONLY_TAG_RE = /^<(Callout|LLMOnly|LLMIgnore)\b[^>]*>$/

// Opening tags whose title-like attribute is itself real prose worth
// checking — promoted to a heading so it survives as text, not markup.
function headingReplacement(trimmed) {
  let m = trimmed.match(/^<Step\b[^>]*\btitle="([^"]*)"[^>]*>$/)
  if (m) return `### ${m[1]}`

  m = trimmed.match(/^<Details\b[^>]*\bsummary="([^"]*)"[^>]*>$/)
  if (m) return `### ${m[1]}`

  m = trimmed.match(/^<Tab\b[^>]*\blabel="([^"]*)"[^>]*>$/)
  if (m) return `#### ${m[1]}`

  return null
}

// Replaces each wrapper-tag line 1:1 so line numbers in Vale's report still
// point at the same line in the real source file.
export function transformMdx(source) {
  return source
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      if (BLANK_LINE_TAGS.has(trimmed)) return ""
      if (BLANK_ONLY_TAG_RE.test(trimmed)) return ""
      return headingReplacement(trimmed) ?? line
    })
    .join("\n")
}

function collectMdxFiles(target) {
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]

  const results = []
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name)
    if (entry.isDirectory()) results.push(...collectMdxFiles(full))
    else if (entry.name.endsWith(".mdx")) results.push(full)
  }
  return results
}

// Mirrors one target (file or directory) under .vale-tmp/content/, applying
// transformMdx to every .mdx file found. Returns the path to hand to vale,
// relative to cwd so its output stays relative too.
function mirrorTarget(target) {
  const relFromContent = path.relative(CONTENT_DIR, target)
  if (relFromContent.startsWith("..")) {
    throw new Error(`vale-preprocess: target must be content/ or a path under it, got ${target}`)
  }

  for (const file of collectMdxFiles(target)) {
    const rel = path.relative(CONTENT_DIR, file)
    const dest = path.join(TMP_DIR, "content", rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, transformMdx(fs.readFileSync(file, "utf-8")), "utf-8")
  }

  return path.relative(process.cwd(), path.join(TMP_DIR, "content", relFromContent))
}

export function runVale(args) {
  const pathArgs = args.filter((a) => !a.startsWith("-"))
  const flagArgs = args.filter((a) => a.startsWith("-"))
  const targets = pathArgs.length ? pathArgs : ["content"]

  fs.rmSync(TMP_DIR, { recursive: true, force: true })
  const mirroredTargets = targets.map((t) => mirrorTarget(path.resolve(process.cwd(), t)))

  const result = spawnSync("vale", [...flagArgs, ...mirroredTargets], { encoding: "utf-8" })
  if (result.error) {
    throw new Error(`vale-preprocess: failed to run vale — ${result.error.message}`)
  }

  // .vale-tmp/content/... -> content/... so reported paths match the real files.
  const tmpContentPrefix = path.join(".vale-tmp", "content") + path.sep
  const restore = (s) => s.split(tmpContentPrefix).join("content" + path.sep)

  return {
    stdout: restore(result.stdout ?? ""),
    stderr: restore(result.stderr ?? ""),
    status: result.status ?? 1,
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const { stdout, stderr, status } = runVale(process.argv.slice(2))
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
  process.exit(status)
}
