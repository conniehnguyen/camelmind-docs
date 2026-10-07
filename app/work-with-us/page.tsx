import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { loadNav, getSlugsFromConfig } from "@/lib/nav"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { getSession } from "@/lib/auth"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { TopNav } from "@/components/Nav/TopNav"
import { ServicesSection, type Package } from "@/components/WorkWithUs/ServicesSection"
import { Faq, type FaqItem } from "@/components/WorkWithUs/Faq"
import { WorkWithUs } from "@/components/WorkWithUs/WorkWithUs"

export const metadata = {
  title: "How Can We Work Together — CamelMind",
  description: "The team behind CamelMind migrates, builds, and maintains documentation for software teams.",
}

const PACKAGES: Package[] = [
  {
    id: "migration",
    name: "Migration",
    tagline: "Move to CamelMind — or away from it — without losing a page.",
    description:
      "We migrate existing documentation into CamelMind's content model: Markdown/MDX conversion, nav structure, redirects, versioning, and role mapping. We also run migrations the other way — out of CamelMind into Docusaurus, MkDocs, GitBook, Mintlify, or wherever you're headed next.",
    tiers: [
      { label: "Small", scope: "Up to 50 pages, one source platform", price: "$2,000", delivery: "1–2 week delivery" },
      { label: "Standard", scope: "Up to 150 pages, one source platform", price: "$4,500", delivery: "2–4 week delivery" },
      { label: "Large", scope: "Up to 400 pages, or multiple source platforms", price: "$8,000", delivery: "4–6 week delivery" },
      { label: "Custom", scope: "400+ pages, multi-product, or a reverse migration out of CamelMind", price: "Quoted", delivery: "Timeline per scope" },
    ],
    included: [
      "Content conversion to Markdown/MDX",
      "Navigation rebuilt (or exported, for a reverse migration) to match your IA",
      "Redirect map from old URLs to new slugs",
      "Image and asset migration",
      "Role/permission mapping, where the source or target platform supports it",
      "One QA pass against the original site",
      "AI-readiness check (llms.txt, AI View) for migrations into CamelMind",
    ],
    notIncluded: [
      "New content writing — gaps found during migration are flagged, not filled",
      "Code sample rewriting or validation",
      "Custom theming beyond existing design tokens",
      "Ongoing hosting or maintenance after handoff",
    ],
    process: [
      { step: "1", label: "Scope call", detail: "Confirm source platform, page count, and access." },
      { step: "2", label: "SOW + 50% deposit", detail: "Work begins on receipt." },
      { step: "3", label: "Conversion + structure", detail: "Content and navigation rebuilt in the target platform." },
      { step: "4", label: "QA pass", detail: "Side-by-side comparison against the original site." },
      { step: "5", label: "Handoff", detail: "Final site, redirect map, and balance due." },
    ],
    oneLiner: "Fixed fee by page count — from $2,000 for a small migration to $8,000 for a large one. Covers conversion, structure, redirects, and one QA pass.",
  },
  {
    id: "build",
    name: "Documentation Build",
    tagline: "Start from nothing. End with a documentation site your team can run.",
    description:
      "A complete CamelMind site — information architecture, written content, API reference, versioning, and auth — scoped and signed off before writing begins.",
    tiers: [
      { label: "Feature area", scope: "~15–25 pages", price: "$5,000", delivery: "3–4 week delivery" },
      { label: "Full product", scope: "~40–60 pages", price: "$9,500", delivery: "5–7 week delivery" },
      { label: "Full developer portal", scope: "80+ pages, API reference, versioning, RBAC", price: "$16,000", delivery: "8–12 week delivery" },
      { label: "Custom", scope: "Multi-product or multi-site", price: "Quoted", delivery: "Timeline per scope" },
    ],
    included: [
      "Information architecture and navigation design",
      "Written content for every page in the agreed outline",
      "OpenAPI wiring for API Reference, where applicable",
      "Versioning and RBAC configuration",
      "llms.txt and AI View setup",
      "One round of written revisions after delivery",
      "One 30-minute launch readout call",
    ],
    notIncluded: [
      "Code sample generation beyond what's in the OpenAPI spec",
      "Hosting setup or CI/CD configuration",
      "Ongoing updates after launch — see the Retainer",
      "Video or multimedia content",
    ],
    process: [
      { step: "1", label: "Scope call", detail: "Confirm outline and access to your product." },
      { step: "2", label: "SOW + 50% deposit", detail: "Work begins on receipt." },
      { step: "3", label: "IA + draft", detail: "Structure first, then content." },
      { step: "4", label: "Review", detail: "One round of written feedback incorporated." },
      { step: "5", label: "Launch + readout", detail: "Delivery, 30-minute call, balance due." },
    ],
    oneLiner: "Fixed fee by page count — $5,000 to $16,000 depending on scope. Covers IA, writing, and configuration; one round of revisions included.",
  },
  {
    id: "retainer",
    name: "Retainer",
    tagline: "Ongoing coverage, so new features ship with docs instead of after them.",
    description:
      "Monthly capacity for release notes, feature docs, and changelog entries on your CamelMind site, plus a monthly doc health summary. Scoped at the start of each month; three-month minimum.",
    tiers: [
      { label: "Light", scope: "8 hrs/month", price: "$1,600/mo", delivery: "Billed 1st of month", note: "Low-cadence releases" },
      { label: "Standard", scope: "15 hrs/month", price: "$2,800/mo", delivery: "Billed 1st of month", note: "Regular release cycles" },
      { label: "Full", scope: "20 hrs/month", price: "$3,600/mo", delivery: "Billed 1st of month", note: "Fast-moving products" },
    ],
    callout: "Hours are a capacity ceiling, not a deliverable count. What gets done within those hours is defined by the monthly task list agreed in advance.",
    included: [
      "Monthly task list agreed by the 25th of the prior month",
      "Release notes and changelog entries for each release",
      "Feature documentation updates — new pages, edits, deprecation notices",
      "Monthly doc health summary",
      "One scheduled check-in call per month",
      "Async access by email, one business day response",
    ],
    notIncluded: [
      "Net-new product areas or full-site rebuilds — quoted separately as a Build",
      "Work beyond the agreed monthly task list without written approval",
      "Unused hours — they don't roll over",
      "Calls beyond the monthly check-in",
    ],
    terms: [
      { label: "Minimum", detail: "3-month minimum" },
      { label: "Exit", detail: "Either party may exit with 30 days' written notice after month 3" },
      { label: "Early exit", detail: "Remaining contract balance due" },
      { label: "Tier change", detail: "30 days' notice; takes effect the following month" },
    ],
    process: [
      { step: "1", label: "Month 0", detail: "Scope call, SOW signed, first month billed upfront." },
      { step: "2", label: "25th of month", detail: "Task list agreed for the following month." },
      { step: "3", label: "1st of month", detail: "Invoice sent, due on receipt." },
      { step: "4", label: "End of month", detail: "Health summary delivered." },
    ],
    oneLiner: "$1,600 to $3,600 a month for eight, fifteen, or twenty hours — scoped monthly, three-month minimum.",
  },
]

const FAQ: FaqItem[] = [
  {
    q: "How do you price engagements?",
    a: "Fixed fee for Migration and Documentation Build — scope, timeline, and price are agreed before any work starts. The Retainer is the one exception: a monthly capacity fee with a task list agreed at the start of each month. No surprise invoices either way.",
  },
  {
    q: "Do you only work on CamelMind sites?",
    a: "Documentation Build and Retainer are CamelMind-native. Migration goes both ways, though: we'll move you into CamelMind from your current tool, or out of CamelMind to Docusaurus, MkDocs, GitBook, Mintlify, or wherever you're headed next.",
  },
  {
    q: "What if we're not sure which engagement we need?",
    a: "That's fine — a short note is usually enough to figure it out. Tell us roughly where things stand and we'll point you at Migration, Build, or Retainer.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes, as standard. Most engagements involve unreleased features or internal architecture. A mutual NDA is part of the SOW process before any work begins.",
  },
  {
    q: "How do you work with engineering teams?",
    a: "Async-first. We work from a defined scope and communicate through a single point of contact on your side. Expect clear deliverables agreed upfront, written status updates, and a monthly check-in call on Retainer engagements.",
  },
  {
    q: "What's a typical timeline?",
    a: "Migration runs 1–6 weeks depending on size and number of source platforms. A Documentation Build runs 3–12 weeks depending on scope. A Retainer starts the month after the SOW is signed.",
  },
]

function Metric({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tracking-tight text-[var(--cm-text-primary)]">{n}</div>
      <div className="text-xs text-[var(--cm-text-muted)] mt-2">{label}</div>
    </div>
  )
}

export default async function WorkWithUsPage() {
  const nav = loadNav()
  const { versions } = loadVersions()
  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const config = getConfig()
  const versionSlugs = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )
  const apiRefConfig = config.apiReference
  const apiRef = apiRefConfig?.enabled
    ? { label: apiRefConfig.navLabel ?? "API Reference", href: "/api-reference", roles: apiRefConfig.roles ?? [] }
    : null

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cm-bg-primary)]">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        authEnabled={authEnabled}
        versions={versions}
        currentVersionId={null}
        currentSlug="/work-with-us"
        versionSlugs={versionSlugs}
        apiRef={apiRef}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--cm-border)]">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10 md:gap-16">
              <div className="hidden md:block">
                <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium">Index</div>
                <div className="font-mono text-[13px] text-[var(--cm-text-muted)] mt-3 leading-[1.9]">
                  001 — Services<br />
                  002 — FAQ<br />
                  003 — Contact
                </div>
              </div>

              <div>
                <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-oasis-teal)] font-medium mb-6">
                  — Documentation services
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-[var(--cm-text-primary)] max-w-2xl mb-8">
                  We write the docs, you write the <span className="text-[var(--cm-oasis-teal)]">code.</span>
                </h1>
                <p className="text-lg text-[var(--cm-text-secondary)] max-w-xl leading-relaxed mb-10">
                  CamelMind itself is open-source and free to self-host. The team behind it also migrates, builds, and maintains documentation for software teams — structured so your users, your support tools, and AI search can all find the right answer.
                </p>

                <div className="flex flex-wrap gap-3 mb-16">
                  <a
                    href="#services"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold bg-[var(--cm-oasis-teal)] text-white hover:opacity-90 transition-opacity"
                  >
                    See the services
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-medium border border-[var(--cm-border)] text-[var(--cm-text-primary)] hover:border-[var(--cm-oasis-teal)] transition-colors"
                  >
                    Get in touch
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-8 border-t border-[var(--cm-border)]">
                  <Metric n="3" label="Ways to work" />
                  <Metric n="1–12" label="Weeks, typical engagement" />
                  <Metric n="100%" label="Content stays yours" />
                  <Metric n="MIT" label="Core stays free, always" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 scroll-mt-20">
          <div className="mb-12 max-w-2xl">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
              001 / Services
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)] mb-4">
              Three ways to work.
            </h2>
            <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed">
              Scope, price, and what&apos;s not included — made plain. If your situation doesn&apos;t fit one of these, we can talk through a custom engagement.
            </p>
          </div>
          <ServicesSection packages={PACKAGES} />
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--cm-border)] scroll-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
            <div>
              <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
                002 / FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)]">
                Six questions.
              </h2>
            </div>
            <Faq items={FAQ} />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="max-w-6xl mx-auto px-6 md:px-10 pb-20 md:pb-28 scroll-mt-20">
          <div className="rounded-xl bg-[var(--cm-night-dune)] px-8 md:px-14 py-14 md:py-16">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-white/50 font-medium mb-4">
              003 / Contact
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-parchment)] max-w-xl mb-4">
              Let&apos;s talk about your documentation.
            </h2>
            <p className="text-lg text-white/70 max-w-lg mb-8 leading-relaxed">
              If you&apos;re not sure which engagement makes sense, that&apos;s fine — a short note below is usually enough to figure it out together. We get back to every inquiry within one business day.
            </p>
            <WorkWithUs tone="onDark" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--cm-border)] px-6 py-6 bg-[var(--cm-bg-secondary)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--cm-text-muted)]">
          <span>© {new Date().getFullYear()} CamelMind. Powered by CamelMind, an MIT License platform.</span>
          <Link href="/home" className="hover:text-[var(--cm-text-secondary)]">Back home</Link>
        </div>
      </footer>
    </div>
  )
}
