// Preprocessor that converts MkDocs-style tab syntax into <Tabs>/<Tab> JSX
// before the MDX compiler sees the source. This avoids all markdown-in-JSX
// indentation and blank-line rules that make hand-authoring tabs painful.
//
// Syntax:
//
//   === "Tab Label"
//   Content for this tab. Any markdown works — bullets, code, callouts, etc.
//
//   === "Another Tab"
//   More content.
//
//   ===
//
// Rules:
//   - === "Label"  opens a tab (single or double quotes both work)
//   - ===          closes the group (required)
//   - No indentation needed inside tabs
//   - Blank lines within tab content are fine
//   - Multiple tab groups per document are supported
//
// Nesting:
//
//   A tab group can contain another tab group in its content as long as the
//   nested group's markers (both === "Label" and the closing ===) are
//   indented relative to the outer group. Any consistent indent works:
//
//   === "Deal Breaker"
//   Outer content.
//
//       === "Sub tab A"
//       Nested content.
//
//       === "Sub tab B"
//       More nested content.
//
//       ===
//
//   ===
//
//   Indentation is what disambiguates a nested group's === markers from the
//   outer group's own siblings/closer — an unindented === always belongs to
//   the group currently being scanned.

function dedent(lines: string[], amount: number): string[] {
  return lines.map((line) => {
    let cut = 0
    while (cut < amount && line[cut] === " ") cut++
    return line.slice(cut)
  })
}

function leadingSpaces(line: string): number {
  return line.match(/^ */)![0].length
}

function processLines(lines: string[]): string[] {
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const openMatch = line.match(/^===\s+["']([^"']+)["']\s*$/)

    if (!openMatch) {
      output.push(line)
      i++
      continue
    }

    // Collect all tabs in this group until the closing ===. Indented ===
    // markers belong to a nested group and are captured as plain content —
    // they're only unwound once we recurse into this tab's own content below.
    const tabs: { label: string; content: string[] }[] = []
    let currentLabel = openMatch[1]
    let currentContent: string[] = []
    let closed = false
    i++

    while (i < lines.length) {
      const groupLine = lines[i]
      const nextTabMatch = groupLine.match(/^===\s+["']([^"']+)["']\s*$/)
      const isCloser = /^===\s*$/.test(groupLine)

      if (isCloser) {
        tabs.push({ label: currentLabel, content: currentContent })
        closed = true
        i++
        break
      } else if (nextTabMatch) {
        tabs.push({ label: currentLabel, content: currentContent })
        currentLabel = nextTabMatch[1]
        currentContent = []
        i++
      } else {
        currentContent.push(groupLine)
        i++
      }
    }

    // Handle unclosed group (EOF without ===)
    if (!closed) {
      tabs.push({ label: currentLabel, content: currentContent })
    }

    if (tabs.length === 0) continue

    output.push("<Tabs>")
    for (const tab of tabs) {
      output.push(`<Tab label="${tab.label}">`)
      output.push("")

      const nestedMarker = tab.content.find((l) => /^\s+===/.test(l))
      const content = nestedMarker
        ? processLines(dedent(tab.content, leadingSpaces(nestedMarker)))
        : tab.content

      output.push(content.join("\n").trim())
      output.push("")
      output.push("</Tab>")
    }
    output.push("</Tabs>")
    output.push("")
  }

  return output
}

export function preprocessTabs(source: string): string {
  return processLines(source.split("\n")).join("\n")
}
