import Link from "next/link"
import { FileText, Search, Palette, Code, Rocket, BookOpen } from "lucide-react"
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
    href: "/guides/writing-docs",
    cta: "Start writing",
  },
  {
    Icon: Search,
    title: "Instant Search",
    description: "Built-in full-text search helps readers find answers quickly across your entire doc site.",
    href: "/getting-started/overview",
    cta: "Learn more",
  },
  {
    Icon: Palette,
    title: "Beautiful Themes",
    description: "The Sahara theme ships with light and dark modes, tuned typography, and polished components.",
    href: "/guides/mdx-components",
    cta: "Explore components",
  },
  {
    Icon: Code,
    title: "Docs as Code",
    description: "Keep documentation alongside your source code with YAML navigation and version support.",
    href: "/guides/navigation",
    cta: "Configure nav",
  },
  {
    Icon: BookOpen,
    title: "Role-Based Access",
    description: "Optional SSO and RBAC let you gate internal pages while keeping public docs open.",
    href: "/guides/auth-rbac",
    cta: "Set up auth",
  },
  {
    Icon: Rocket,
    title: "Deploy Anywhere",
    description: "Static export, Docker, or any Node.js host — publish your docs wherever you deploy.",
    href: "/reference/configuration",
    cta: "View config",
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
        <section className="bg-[var(--cm-night-dune)] text-[var(--cm-parchment)] px-4 md:px-6 py-14 md:py-20 text-center">
          <p className="text-[var(--cm-sandstone)] text-sm font-semibold uppercase tracking-widest mb-3">Open Source</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-[family-name:var(--cm-font-heading)]">{config.title}</h1>
          <p className="text-[var(--cm-sandstone)] text-lg max-w-xl mx-auto mb-8">{config.tagline}</p>
          <p className="text-[var(--cm-text-muted)] text-base max-w-2xl mx-auto mb-8">
            Build beautiful documentation from Markdown and MDX. Publish instantly, deploy anywhere, and keep docs close to your code.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/getting-started/installation" className="cm-primary-button px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
              Get Started
            </Link>
            {config.links.github && (
              <a
                href={config.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent hover:bg-[var(--cm-bg-tertiary)] text-[var(--cm-parchment)] px-5 py-2.5 rounded-[var(--cm-radius-md)] text-sm font-medium transition-colors border border-[var(--cm-border)]"
              >
                View on GitHub
              </a>
            )}
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
          {config.links.github && (
            <a href={config.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--cm-oasis-teal)] transition-colors">
              GitHub
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}
