/**
 * Generates one PDF per doc page using Playwright headless print.
 * Pages are captured from the live Next.js dev server (port 3000).
 *
 * Usage:
 *   npx tsx scripts/generate-pdfs.ts [--port 3000] [--out .pdf-pages]
 *
 * Outputs: .pdf-pages/<slug-flattened>.pdf  (temp dir, consumed by generate-master-pdf.ts)
 */

import { chromium } from "playwright"
import { SignJWT } from "jose"
import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import config from "../camelmind.config"

const SITE_TITLE = config.title

const ROOT = path.resolve(process.cwd())

// Resolve the latest stable version's nav file from versions.yml
const { versions: _versions } = yaml.load(fs.readFileSync(path.join(ROOT, "versions.yml"), "utf-8")) as {
  versions: { id: string; stable: boolean; nav: string }[]
}
const _latestVersion = _versions.find((v) => v.stable) ?? _versions[0]
const NAV_FILE = path.join(ROOT, _latestVersion.nav)

const PORT = parseInt(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? "3000")
const OUT_DIR = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1]
  ? path.resolve(process.argv.find((a) => a.startsWith("--out="))!.split("=")[1])
  : path.join(ROOT, ".pdf-pages")
// --no-auth: skip the login step (use when rendering a static offline export where auth is bypassed)
const SKIP_AUTH = process.argv.includes("--no-auth")

const CONCURRENCY = 4
const BASE_URL = `http://localhost:${PORT}`

type NavChild = { label: string; slug: string; roles?: string[]; children?: NavChild[] }
type NavEntry = { label: string; slug: string; file?: string; roles?: string[]; section?: NavChild[] }
type NavGroup = { label: string; dropdown?: boolean; items?: NavEntry[] }

type PageEntry = { slug: string; title: string; group: string; section?: string }

function collectPages(nav: (NavEntry | NavGroup)[]): PageEntry[] {
  const pages: PageEntry[] = []

  for (const item of nav) {
    if ("items" in item && item.items) {
      for (const entry of item.items) {
        if (entry.slug && entry.file) {
          pages.push({ slug: entry.slug, title: entry.label, group: item.label })
        }
        for (const section of entry.section ?? []) {
          if ((section as NavEntry).file) {
            pages.push({ slug: section.slug, title: section.label, group: item.label, section: entry.label })
          }
          for (const child of section.children ?? []) {
            if ((child as NavEntry).file) {
              pages.push({ slug: child.slug, title: child.label, group: item.label, section: section.label })
            }
          }
        }
      }
    }
  }

  return pages
}

function slugToFilename(slug: string): string {
  return slug.replace(/^\//, "").replace(/\//g, "__") + ".pdf"
}

type Cookie = Awaited<ReturnType<import("playwright").BrowserContext["cookies"]>>[number]

async function generatePage(
  browser: import("playwright").Browser,
  page: PageEntry,
  outDir: string,
  cookies: Cookie[]
): Promise<{ page: PageEntry; file: string } | null> {
  const url = `${BASE_URL}${page.slug}`
  const outFile = path.join(outDir, slugToFilename(page.slug))

  const ctx = await browser.newContext()
  await ctx.addCookies(cookies)
  const pw = await ctx.newPage()

  try {
    await pw.goto(url, { waitUntil: "networkidle", timeout: 30000 })
    await pw.waitForSelector("article", { timeout: 10000 })

    // Force-open all <details> elements so their content is captured
    // Also release height/overflow constraints that would clip content in print
    await pw.evaluate(() => {
      document.querySelectorAll("details").forEach((d) => { d.open = true })

      // Show print-only elements by removing the Tailwind 'hidden' class
      document.querySelectorAll<HTMLElement>('[data-print="show"]').forEach((el) => {
        el.classList.remove("hidden")
      })

      // Release Tailwind h-screen / overflow-hidden / overflow-y-auto layout
      const style = document.createElement("style")
      style.textContent = `
        html, body, .h-screen, .h-full { height: auto !important; min-height: 0 !important; }
        .overflow-hidden, .overflow-y-auto, .overflow-x-hidden { overflow: visible !important; }
        .flex-1 { flex: none !important; height: auto !important; }
        nav, aside, [data-print="hide"] { display: none !important; }
      `
      document.head.appendChild(style)
    })

    await pw.pdf({
      path: outFile,
      format: "Letter",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-family:system-ui,sans-serif;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;padding:0 16mm;">
          <span>${page.group}${page.section ? " › " + page.section : ""}</span>
          <span style="color:#111827;font-weight:600;">${SITE_TITLE}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-family:system-ui,sans-serif;font-size:8px;color:#6b7280;display:flex;justify-content:space-between;padding:0 16mm;">
          <span>${page.title}</span>
          <span></span>
        </div>`,
    })

    return { page, file: outFile }
  } catch (e) {
    console.warn(`  ⚠ Failed: ${url} — ${(e as Error).message}`)
    return null
  } finally {
    await ctx.close()
  }
}

async function main() {
  // Read nav
  const raw = fs.readFileSync(NAV_FILE, "utf-8")
  const nav = (yaml.load(raw) as { nav: (NavEntry | NavGroup)[] }).nav
  const pages = collectPages(nav)

  console.log(`▶ Generating PDFs for ${pages.length} pages → ${OUT_DIR}`)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Check server is up
  try {
    const res = await fetch(`${BASE_URL}/home`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch {
    console.error(`✗ Dev server not reachable at ${BASE_URL}. Run: npm run dev`)
    process.exit(1)
  }

  const browser = await chromium.launch()

  // Sign in via the dev login UI so we get a real session cookie.
  // Skip when rendering against a static offline export (auth is bypassed there).
  let cookies: Cookie[] = []
  if (!SKIP_AUTH) {
    const authCtx = await browser.newContext()
    const authPage = await authCtx.newPage()
    await authPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
    await authPage.click("button:has-text('Staff')")
    await authPage.waitForURL(/\/home|\/getting-started/, { timeout: 10000 })
    cookies = await authCtx.cookies()
    await authPage.close()
    await authCtx.close()
  }

  const results: Array<{ page: PageEntry; file: string }> = []

  // Process in batches of CONCURRENCY
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY)
    const done = await Promise.all(batch.map((p) => generatePage(browser, p, OUT_DIR, cookies)))
    for (const r of done) {
      if (r) {
        results.push(r)
        console.log(`  ✓ ${r.page.slug}`)
      }
    }
  }

  await browser.close()

  // Write manifest — ordered list for master PDF assembly
  const manifest = results.map((r) => ({ slug: r.page.slug, title: r.page.title, group: r.page.group, section: r.page.section, file: r.file }))
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2))

  console.log(`✓ ${results.length}/${pages.length} pages generated`)
}

main().catch((e) => { console.error(e); process.exit(1) })
