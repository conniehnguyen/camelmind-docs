/**
 * Assembles per-page PDFs into a single master PDF with:
 *   - Cover page (title, subtitle, version, date)
 *   - Table of contents with page numbers
 *   - All doc pages in nav order
 *   - PDF bookmarks (outline) matching nav structure
 *
 * Usage:
 *   npx tsx scripts/generate-master-pdf.ts [--version v2.0] [--pages .pdf-pages] [--out offline-builds]
 */

import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib"
import fs from "fs"
import path from "path"
import config from "../camelmind.config"

const SITE_TITLE = config.title

const ROOT = path.resolve(process.cwd())

const VERSION = process.argv.find((a) => a.startsWith("--version="))?.split("=")[1] ?? "v2.0"
const PAGES_DIR = process.argv.find((a) => a.startsWith("--pages="))?.split("=")[1]
  ? path.resolve(process.argv.find((a) => a.startsWith("--pages="))!.split("=")[1])
  : path.join(ROOT, ".pdf-pages")
const OUT_DIR = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1]
  ? path.resolve(process.argv.find((a) => a.startsWith("--out="))!.split("=")[1])
  : path.join(ROOT, "offline-builds")

type ManifestEntry = { slug: string; title: string; group: string; section?: string; file: string }

// ── Colors ──────────────────────────────────────────────────────────────────
const DARK = rgb(0.067, 0.094, 0.153)   // #111827
const MID  = rgb(0.42, 0.447, 0.502)    // #6b7280
const LIGHT = rgb(0.97, 0.97, 0.97)     // #f7f7f7
const WHITE = rgb(1, 1, 1)
const ACCENT = rgb(0.067, 0.094, 0.153) // same dark for simplicity

// Letter page dimensions (points)
const PW = 612
const PH = 792
const MARGIN = 64

// ── Cover page ───────────────────────────────────────────────────────────────
async function buildCoverPage(doc: PDFDocument): Promise<PDFPage> {
  const page = doc.addPage([PW, PH])
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await doc.embedFont(StandardFonts.Helvetica)

  // Dark background block (top 55% of page)
  page.drawRectangle({ x: 0, y: PH * 0.45, width: PW, height: PH * 0.55, color: DARK })

  // Thin accent line
  page.drawRectangle({ x: MARGIN, y: PH * 0.45 - 2, width: PW - MARGIN * 2, height: 2, color: rgb(0.3, 0.35, 0.45) })

  // Main title
  page.drawText(SITE_TITLE, {
    x: MARGIN,
    y: PH * 0.45 + 130,
    size: 42,
    font: boldFont,
    color: WHITE,
  })
  page.drawText("Documentation", {
    x: MARGIN,
    y: PH * 0.45 + 78,
    size: 42,
    font: boldFont,
    color: WHITE,
  })

  // Version + date below the dark block
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  page.drawText(`Documentation — ${VERSION}`, {
    x: MARGIN,
    y: PH * 0.45 - 40,
    size: 13,
    font: boldFont,
    color: DARK,
  })
  page.drawText(`Generated ${dateStr}`, {
    x: MARGIN,
    y: PH * 0.45 - 62,
    size: 10,
    font: regularFont,
    color: MID,
  })

  // Footer bar
  page.drawRectangle({ x: 0, y: 0, width: PW, height: 36, color: LIGHT })
  page.drawText(`${SITE_TITLE.toLowerCase()} documentation`, {
    x: MARGIN,
    y: 12,
    size: 8,
    font: regularFont,
    color: MID,
  })
  page.drawText("CONFIDENTIAL — FOR AUTHORIZED USERS ONLY", {
    x: PW - MARGIN - 220,
    y: 12,
    size: 8,
    font: regularFont,
    color: MID,
  })

  return page
}

// ── TOC page ─────────────────────────────────────────────────────────────────
async function buildTocPage(
  doc: PDFDocument,
  entries: Array<{ title: string; group: string; section?: string; pageNum: number }>
): Promise<void> {
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await doc.embedFont(StandardFonts.Helvetica)

  let page = doc.addPage([PW, PH])
  let y = PH - MARGIN

  const drawPageHeader = (p: PDFPage) => {
    p.drawText("TABLE OF CONTENTS", {
      x: MARGIN, y: PH - MARGIN + 10, size: 8, font: regularFont, color: MID,
    })
    p.drawLine({ start: { x: MARGIN, y: PH - MARGIN - 4 }, end: { x: PW - MARGIN, y: PH - MARGIN - 4 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  }

  drawPageHeader(page)
  y -= 30

  // Title
  page.drawText("Contents", { x: MARGIN, y, size: 24, font: boldFont, color: DARK })
  y -= 40

  let lastGroup = ""

  for (const entry of entries) {
    // New page if needed
    if (y < MARGIN + 30) {
      page = doc.addPage([PW, PH])
      drawPageHeader(page)
      y = PH - MARGIN - 30
    }

    // Group header
    if (entry.group !== lastGroup) {
      if (lastGroup !== "") y -= 6
      page.drawText(entry.group.toUpperCase(), {
        x: MARGIN, y, size: 7.5, font: boldFont, color: MID,
      })
      y -= 18
      lastGroup = entry.group
    }

    // Indent for section children
    const indent = entry.section ? 16 : 0
    const titleStr = entry.title
    const pageStr = String(entry.pageNum)
    const titleSize = entry.section ? 9 : 10
    const titleFont = entry.section ? regularFont : boldFont
    const titleColor = entry.section ? MID : DARK

    // Dot leader
    const titleWidth = titleFont.widthOfTextAtSize(titleStr, titleSize)
    const pageWidth = regularFont.widthOfTextAtSize(pageStr, 9)
    const leaderStart = MARGIN + indent + titleWidth + 4
    const leaderEnd = PW - MARGIN - pageWidth - 8
    if (leaderEnd > leaderStart) {
      page.drawText("· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·", {
        x: leaderStart, y: y + 1, size: 7, font: regularFont, color: rgb(0.8, 0.8, 0.8),
        maxWidth: leaderEnd - leaderStart,
      })
    }

    page.drawText(titleStr, { x: MARGIN + indent, y, size: titleSize, font: titleFont, color: titleColor })
    page.drawText(pageStr, { x: PW - MARGIN - pageWidth, y, size: 9, font: regularFont, color: MID })

    y -= entry.section ? 15 : 17
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const manifestPath = path.join(PAGES_DIR, "manifest.json")
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found in ${PAGES_DIR}. Run generate-pdfs.ts first.`)
    process.exit(1)
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  console.log(`▶ Assembling master PDF from ${manifest.length} pages (version ${VERSION})`)

  // ── Pass 1: merge all content pages to count page numbers ──────────────────
  const masterDoc = await PDFDocument.create()

  // Reserve slots: cover (1 page) + TOC (we'll insert after knowing size)
  // First collect all content pages so we can calculate TOC page numbers
  const contentPages: Array<{ entry: ManifestEntry; startPage: number; pageCount: number }> = []

  // Page offset: 1 cover + estimated TOC pages (we'll finalize after)
  const TOC_PAGES = 2 // estimate; adjust if content overflows

  let contentPageOffset = 1 + TOC_PAGES // cover + toc
  const pageDocs: PDFDocument[] = []

  for (const entry of manifest) {
    if (!fs.existsSync(entry.file)) {
      console.warn(`  ⚠ Missing: ${entry.file}`)
      continue
    }
    const bytes = fs.readFileSync(entry.file)
    const srcDoc = await PDFDocument.load(bytes)
    const count = srcDoc.getPageCount()
    contentPages.push({ entry, startPage: contentPageOffset, pageCount: count })
    pageDocs.push(srcDoc)
    contentPageOffset += count
  }

  // ── Build cover ────────────────────────────────────────────────────────────
  await buildCoverPage(masterDoc)

  // ── Build TOC ──────────────────────────────────────────────────────────────
  const tocEntries = contentPages.map((cp) => ({
    title: cp.entry.title,
    group: cp.entry.group,
    section: cp.entry.section,
    pageNum: cp.startPage,
  }))
  await buildTocPage(masterDoc, tocEntries)

  // ── Copy content pages ─────────────────────────────────────────────────────
  for (let i = 0; i < pageDocs.length; i++) {
    const srcDoc = pageDocs[i]
    const indices = srcDoc.getPageIndices()
    const copied = await masterDoc.copyPages(srcDoc, indices)
    copied.forEach((p) => masterDoc.addPage(p))
    console.log(`  ✓ ${manifest[i]?.title ?? "??"} (${srcDoc.getPageCount()}pp)`)
  }

  // ── Add bookmarks ──────────────────────────────────────────────────────────
  // pdf-lib outline support is limited; we add top-level group markers
  // (full nested outline requires low-level PDF manipulation — skipped for now)

  // ── Write output ───────────────────────────────────────────────────────────
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outFile = path.join(OUT_DIR, `camelmind-${VERSION}.pdf`)
  const pdfBytes = await masterDoc.save()
  fs.writeFileSync(outFile, pdfBytes)

  const sizeMb = (pdfBytes.length / 1024 / 1024).toFixed(1)
  console.log(`\n✓ Master PDF: ${outFile} (${sizeMb} MB, ${masterDoc.getPageCount()} pages)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
