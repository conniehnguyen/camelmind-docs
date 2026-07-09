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

export function preprocessTabs(source: string): string {
  const lines = source.split("\n")
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

    // Collect all tabs in this group until the closing ===
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
      output.push(tab.content.join("\n").trim())
      output.push("")
      output.push("</Tab>")
    }
    output.push("</Tabs>")
    output.push("")
  }

  return output.join("\n")
}
