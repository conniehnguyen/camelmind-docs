import Link from "next/link"
import Image from "next/image"
import { FileText, Search, Palette, Code, Rocket, BookOpen, ArrowRight } from "lucide-react"
import { loadNav, getSlugsFromConfig } from "@/lib/nav"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { getSession } from "@/lib/auth"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { TopNav } from "@/components/Nav/TopNav"

const FEATURE_CARDS = [
  {
    Icon: FileText,
    title: "Markdown First",
    description: "Write documentation in Markdown and MDX with a rich component library out of the box.",
    href: "/getting-started/writing-content",
    cta: "Start writing",
  },
  {
    Icon: Search,
    title: "Instant Search",
    description: "Built-in full-text search helps readers find answers quickly across your entire doc site.",
    href: "/getting-started/introduction#whats-in-v0217",
    cta: "Learn more",
  },
  {
    Icon: Palette,
    title: "Beautiful Themes",
    description: "The Sahara theme ships with light and dark modes, tuned typography, and polished components.",
    href: "/getting-started/mdx-components",
    cta: "Explore components",
  },
  {
    Icon: Code,
    title: "Docs as Code",
    description: "Keep documentation alongside your source code with YAML navigation and version support.",
    href: "/getting-started/navigation",
    cta: "Configure nav",
  },
  {
    Icon: BookOpen,
    title: "Role-Based Access",
    description: "Optional SSO and RBAC let you gate internal pages while keeping public docs open.",
    href: "/features/auth-rbac",
    cta: "Set up auth",
  },
  {
    Icon: Rocket,
    title: "Deploy Anywhere",
    description: "Deploy your site on your own infra with Docker, static export, or any Node.js host — publish your docs wherever you deploy.",
    href: "/deployment",
    cta: "Start deploying",
  },
]

export default async function HomePage() {
  const config = getConfig()
  const nav = loadNav()
  const { versions } = loadVersions()
  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const versionSlugs = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )

  const apiRefConfig = config.apiReference
  const apiRef = apiRefConfig?.enabled
    ? { label: apiRefConfig.navLabel ?? "API Reference", href: "/api-reference", roles: apiRefConfig.roles ?? [] }
    : null

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        authEnabled={authEnabled}
        versions={versions}
        currentVersionId={null}
        currentSlug="/home"
        versionSlugs={versionSlugs}
        apiRef={apiRef}
      />

      <main className="flex-1 bg-[var(--cm-bg-primary)]">
        <section className="relative overflow-hidden bg-[var(--cm-bg-primary)] border-b border-[var(--cm-border)]">
          <div className="max-w-6xl mx-auto flex flex-col md:block md:relative md:min-h-[560px]">
            <div className="order-2 md:order-none relative h-64 sm:h-80 md:h-full md:absolute md:inset-y-0 md:right-0 md:w-[62%] overflow-hidden">
              <Image
                src="/images/cami-arriving.png"
                alt="Cami the camel arriving at a desert oasis"
                fill
                sizes="(min-width: 768px) 62vw, 100vw"
                className="object-cover object-center scale-105 md:[mask-image:linear-gradient(to_right,transparent,black_30%)] md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_30%)]"
                priority
              />
            </div>

            <div className="order-1 md:order-none relative z-10 px-6 md:px-10 py-12 md:py-24 max-w-xl">
              <div className="inline-flex w-fit items-center rounded-full border border-[var(--cm-border)] bg-[var(--cm-bg-secondary)]/80 p-1 pr-4 text-sm mb-6">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--cm-bg-tertiary)] px-3 py-1 text-[var(--cm-text-muted)] font-medium mr-3">
                  <span aria-hidden="true">🐪</span> v0.3.2
                </span>
                <span className="text-[var(--cm-link)] font-medium">Welcome to {config.title}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] text-[var(--cm-text-primary)] mb-6">
                {config.tagline}
              </h1>

              <p className="text-[var(--cm-text-secondary)] text-lg max-w-md mb-8">
                Open-source docs-as-code platform for documentation sites, API references, and <br />developer portals.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/getting-started/installation"
                  className="cm-primary-button inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURE_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col gap-4 p-7 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-bg-secondary)] hover:border-[var(--cm-oasis-teal)] hover:shadow-md transition-all"
                >
                  <card.Icon size={28} className="text-[var(--cm-oasis-teal)] shrink-0" />
                  <h3 className="text-lg font-semibold text-[var(--cm-text-primary)]">{card.title}</h3>
                  <p className="text-base text-[var(--cm-text-secondary)] leading-relaxed flex-1">{card.description}</p>
                  <span className="text-sm font-medium text-[var(--cm-oasis-teal)] group-hover:text-[var(--cm-link-hover)] transition-colors">
                    {card.cta} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--cm-border)] px-6 py-6 bg-[var(--cm-bg-secondary)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--cm-text-muted)]">
          <span>© {new Date().getFullYear()} CamelMind. MIT License.</span>
        </div>
      </footer>
    </div>
  )
}
