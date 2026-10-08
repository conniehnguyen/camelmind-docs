import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { loadNav, getSlugsFromConfig } from "@/lib/nav"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { getSession } from "@/lib/auth"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { TopNav } from "@/components/Nav/TopNav"
import { ServiceBlock, type ServiceBlockData } from "@/components/WorkWithUs/ServiceBlock"
import { WhyUs, WHY_US_REASONS } from "@/components/WorkWithUs/WhyUs"
import { PricingCards, type PricingCard } from "@/components/WorkWithUs/PricingCards"
import { Faq, type FaqItem } from "@/components/WorkWithUs/Faq"
import { WorkWithUs } from "@/components/WorkWithUs/WorkWithUs"

export const metadata = {
  title: "How Can We Work Together — CamelMind",
  description: "Documentation services for software teams, from the team behind CamelMind — strategy and build, migration, and ongoing retainer support.",
}

const SERVICES: ServiceBlockData[] = [
  {
    n: "01",
    title: "Documentation strategy & build",
    tagline: "Turn product knowledge into documentation developers can actually use.",
    paragraphs: [
      "We'll work with your product and engineering teams to understand the product, define the information architecture, and create the documentation from the ground up.",
    ],
    listIntro: "Depending on your needs, that can include:",
    items: [
      "Information architecture and navigation",
      "Getting started and onboarding content",
      "Guides, how-tos, and conceptual documentation",
      "API documentation and OpenAPI integration",
      "Developer portal content",
      "Versioning and content organization",
      "Authentication and role-based documentation",
      "Search and discoverability",
      "AI-readable documentation and retrieval considerations",
      "Documentation standards and reusable content patterns",
    ],
    closing: "We can build on the platform you already use or help you move to one that better fits your team.",
  },
  {
    n: "02",
    title: "Documentation migration",
    tagline: "Move your docs without starting over.",
    paragraphs: [
      "Changing documentation platforms shouldn't mean losing years of content, structure, or search equity.",
      "We can migrate your existing documentation between docs-as-code and documentation platforms, including Markdown and MDX-based systems.",
    ],
    listIntro: "We handle:",
    items: [
      "Markdown and MDX conversion",
      "Information architecture and navigation",
      "URL and redirect mapping",
      "Images and other assets",
      "Versioning",
      "Frontmatter and metadata",
      "Role and permission mapping, where supported",
      "Content QA against the original site",
      "Documentation cleanup and restructuring where appropriate",
    ],
    closing: (
      <>
        We work across platforms including Docusaurus, MkDocs, Astro, Mintlify, GitBook, and other docs-as-code
        systems. And yes, we can migrate <span className="text-[var(--cm-oasis-teal)]">to CamelMind</span>.
      </>
    ),
  },
  {
    n: "03",
    title: "Documentation retainer",
    tagline: "Keep documentation in step with the product.",
    paragraphs: [
      "Documentation shouldn't be a cleanup project after every release.",
      "With an ongoing engagement, we become an extension of your product and engineering team. We can take on a defined amount of documentation work each month, based on your release cadence and priorities.",
    ],
    listIntro: "Typical work includes:",
    items: [
      "New feature documentation",
      "Getting-started and onboarding improvements",
      "How-to and conceptual content",
      "API documentation updates",
      "Release notes and changelogs",
      "Deprecation and migration documentation",
      "Documentation audits and cleanup",
      "Information architecture improvements",
      "Search and discoverability improvements",
      "AI-readiness and retrieval reviews",
    ],
    closing: "Documentation built with the same care as your product.",
  },
]

const PRICING: PricingCard[] = [
  {
    name: "Documentation Build",
    description: "For teams starting a new documentation site or rebuilding an existing one.",
    price: "Starting at $5,000",
  },
  {
    name: "Migration",
    description: "For teams moving documentation between platforms without losing content, structure, or URLs.",
    price: "Starting at $2,000",
  },
  {
    name: "Documentation Retainer",
    description: "For teams that need documentation to keep pace with an active product.",
    price: "Starting at $1,600/month",
  },
]

const FAQ: FaqItem[] = [
  {
    q: "Do you only work with CamelMind?",
    a: "No. We're the team behind CamelMind, but our documentation services are platform agnostic. We can work with your existing docs-as-code stack or help you evaluate and migrate to another platform. We're comfortable with Docusaurus, MkDocs, Astro, Mintlify, GitBook, and other modern documentation systems.",
  },
  {
    q: "What makes you different from a technical writing agency?",
    a: "We're experienced Technical Writers who also build documentation infrastructure. That means we can work at both levels: the content your users read and the system your team uses to create, publish, organize, and maintain that content.",
  },
  {
    q: "Do you work directly with engineers?",
    a: "Yes. That's a big part of how we work. We can work from product requirements, API specifications, source code, design documentation, engineering walkthroughs, and conversations with subject-matter experts. Our goal is to take the documentation work off your engineers' plate without losing the technical accuracy developers expect.",
  },
  {
    q: "Can you work with our existing documentation?",
    a: "Absolutely. We can audit and improve an existing documentation site, restructure its information architecture, migrate it to another platform, or simply take over ongoing documentation work. You don't need to start from scratch.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes. We're accustomed to working with unreleased products, APIs, architecture, and internal documentation. We can sign a mutual NDA before work begins.",
  },
  {
    q: "How do you work with our team?",
    a: "We're async-first and work closely with a designated point of contact on your team. Depending on the engagement, we'll collaborate directly with engineering, product, design, developer experience, or customer-facing teams. We establish scope and deliverables up front, communicate progress clearly, and keep the process lightweight.",
  },
  {
    q: "Where are you located?",
    a: "We're based in Silicon Valley, California, and work with software teams remotely.",
  },
  {
    q: "We're not sure what we need. Can we still talk?",
    a: "Absolutely. Send us a note about your product, your current documentation setup, and what's not working. We'll help you figure out whether a documentation build, migration, retainer, or something else makes sense.",
  },
]

function StatCard({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tracking-tight text-[var(--cm-text-primary)]">{title}</div>
      <div className="text-xs text-[var(--cm-text-muted)] mt-2 leading-relaxed">{description}</div>
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
                <div className="font-mono text-[13px] text-[var(--cm-text-muted)] mt-3 leading-[1.9] flex flex-col">
                  <a href="#services" className="hover:text-[var(--cm-oasis-teal)] transition-colors">001 — Services</a>
                  <a href="#why-us" className="hover:text-[var(--cm-oasis-teal)] transition-colors">002 — Why us</a>
                  <a href="#pricing" className="hover:text-[var(--cm-oasis-teal)] transition-colors">003 — Pricing</a>
                  <a href="#faq" className="hover:text-[var(--cm-oasis-teal)] transition-colors">004 — FAQ</a>
                  <a href="#contact" className="hover:text-[var(--cm-oasis-teal)] transition-colors">005 — Contact</a>
                </div>
              </div>

              <div>
                <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-oasis-teal)] font-medium mb-6">
                  — Documentation services for software teams
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-[var(--cm-text-primary)] mb-8">
                  Documents built <span className="text-[var(--cm-oasis-teal)]">with the same care as your product.</span>
                </h1>
                <div className="flex flex-col gap-4 mb-8">
                  <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed">
                    We&apos;re the team behind CamelMind, and we&apos;ve spent 10+ years writing documentation for developers, building docs platforms, and working alongside engineering and product teams.
                  </p>
                  <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed">
                    We bring that experience to your documentation, wherever it lives.
                  </p>
                  <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed">
                    Whether you&apos;re starting a developer portal, rebuilding an existing knowledge base, migrating between docs-as-code platforms, or need someone to keep documentation in step with your releases, we can help.
                  </p>
                  <p className="text-base font-semibold text-[var(--cm-text-primary)]">
                    Based in Silicon Valley. Working with software teams wherever they are.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-16">
                  <a
                    href="#services"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold bg-[var(--cm-oasis-teal)] text-white hover:opacity-90 transition-opacity"
                  >
                    See our services
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-medium border border-[var(--cm-border)] text-[var(--cm-text-primary)] hover:border-[var(--cm-oasis-teal)] transition-colors"
                  >
                    Talk to us
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-8 border-t border-[var(--cm-border)]">
                  <StatCard title="10+ years" description="Writing for developers" />
                  <StatCard title="Platform agnostic" description="Docusaurus, MkDocs, Astro, Mintlify, GitBook, and more" />
                  <StatCard title="Docs as product" description="IA, content, tooling, search, and developer experience" />
                  <StatCard title="AI-ready" description="Structured for human readers and machine retrieval" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How we can work together */}
        <section id="services" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 scroll-mt-20">
          <div className="mb-14">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
              001 / Services
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)] mb-4">
              How we can work together
            </h2>
            <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed mb-2">
              Good documentation isn&apos;t just well-written pages. It&apos;s the right information, in the right structure, on the right platform, at the right point in the product experience.
            </p>
            <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed">
              We can work with your existing stack or help you choose a better one.
            </p>
          </div>
          <div className="flex flex-col gap-14">
            {SERVICES.map((s) => (
              <ServiceBlock key={s.n} service={s} />
            ))}
          </div>
        </section>

        {/* Why work with us */}
        <section id="why-us" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--cm-border)] scroll-mt-20">
          <div className="mb-14">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
              002 / Why us
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)] mb-5">
              Why work with us?
            </h2>
            <p className="text-xl font-medium text-[var(--cm-text-primary)] mb-4">
              We&apos;ve been on both sides of the docs stack.
            </p>
            <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed mb-3">
              We&apos;re not a generalist content agency learning your product from the outside. We&apos;re career Technical Writers and Documentation Engineers who have spent 10+ years working with developers, engineers, product managers, and customers.
            </p>
            <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed mb-5">
              We&apos;ve written API documentation, developer guides, product documentation, onboarding content, knowledge bases, and technical explainers. We&apos;ve also built the infrastructure that publishes and maintains those docs. That combination matters.
            </p>
            <p className="text-lg font-semibold text-[var(--cm-text-primary)]">
              We understand the writing. We understand the technology. And we understand the reader.
            </p>
          </div>
          <WhyUs reasons={WHY_US_REASONS} />
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--cm-border)] scroll-mt-20">
          <div className="mb-10">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
              003 / Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)]">
              Our services
            </h2>
          </div>
          <PricingCards cards={PRICING} />
          <p className="text-sm text-[var(--cm-text-muted)] mt-6">
            Custom engagements are available for larger documentation programs, multi-product sites, and complex migrations.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--cm-border)] scroll-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
            <div>
              <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium mb-4">
                004 / FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)]">
                Frequently asked questions
              </h2>
            </div>
            <Faq items={FAQ} />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="max-w-6xl mx-auto px-6 md:px-10 pb-20 md:pb-28 scroll-mt-20">
          <div className="rounded-xl bg-[var(--cm-night-dune)] px-8 md:px-14 py-14 md:py-16">
            <div className="font-mono text-[11px] tracking-[1.2px] uppercase text-white/50 font-medium mb-4">
              005 / Contact
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-parchment)] mb-4">
              Let&apos;s make your documentation better
            </h2>
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-lg text-white/70 leading-relaxed">
                You don&apos;t need to figure out the documentation strategy, platform, information architecture, and writing process on your own.
              </p>
              <p className="text-lg text-white/70 leading-relaxed">
                Tell us where you are today and where you want your documentation to go. We&apos;ll help you figure out the next step.
              </p>
            </div>
            <p className="text-sm font-semibold text-white/80 mb-8">
              Based in Silicon Valley. Built by Technical Writers.
            </p>
            <WorkWithUs tone="onDark" ctaLabel="Talk to us" />
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
