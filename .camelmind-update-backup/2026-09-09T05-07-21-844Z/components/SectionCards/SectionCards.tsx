import Link from "next/link"
import { FileText } from "lucide-react"
import { loadFrontmatterOnly } from "@/lib/mdx"
import type { NavEntry, NavChild } from "@/lib/nav-types"

// nav.yml's own `description` wins; otherwise fall back to the linked file's frontmatter
// description, so authors don't have to duplicate it in both places. Returns undefined
// (rendered as nothing) when neither source has one.
function resolveDescription(item: NavEntry | NavChild): string | undefined {
  if (item.description) return item.description
  if (!item.file) return undefined
  try {
    return loadFrontmatterOnly(item.file).description
  } catch {
    return undefined
  }
}

// Plain doc link — used both for articles listed inside a category block and for a
// standalone leaf item at the top level of a section (same styling either way).
function ArticleLink({ doc }: { doc: NavChild }) {
  return (
    <Link
      href={doc.slug}
      className="group flex items-center gap-2 py-1.5 text-sm text-[var(--cm-link)] hover:text-[var(--cm-link-hover)] transition-colors"
    >
      <FileText size={14} className="shrink-0 opacity-70" />
      <span className="group-hover:underline">{doc.label}</span>
    </Link>
  )
}

// One row inside a category's article list — always a flat link to that article's own page,
// regardless of whether it has further children of its own; those live on ITS OWN landing
// page (reached via SectionCards' `entry.children` branch when you click through), never
// inlined here. `detailed` distinguishes a category's OWN dedicated landing page (true — its
// children are the whole point of the page, so each one's description shows) from a preview
// of that category inside a bigger section listing (false — the category's own top-level
// description already covers it, so repeating each article's description would be noise).
function ArticleEntry({ doc, detailed }: { doc: NavChild; detailed: boolean }) {
  const description = detailed ? resolveDescription(doc) : undefined

  return (
    <li>
      <ArticleLink doc={doc} />
      {description && (
        <p className="text-sm text-[var(--cm-text-secondary)] leading-relaxed mt-0.5 ml-[22px]">
          {description}
        </p>
      )}
    </li>
  )
}

// Category block — article-count badge, optional title + description on the left,
// linked article list on the right. Used for a section child with its own children,
// and for an entry's flat `children` list treated as one implicit, unlabeled category.
function CategoryBlock({
  title,
  description,
  articles,
  detailed = false,
}: {
  title?: string
  description?: string
  articles: NavChild[]
  detailed?: boolean
}) {
  return (
    <div className="py-6 first:pt-0">
      <div className="flex items-center gap-2 mb-3">
        {title && <h3 className="text-base font-semibold text-[var(--cm-text-primary)]">{title}</h3>}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--cm-text-muted)] bg-[var(--cm-bg-secondary)]">
          {articles.length} article{articles.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className={`grid grid-cols-1 gap-6 md:gap-10 ${description ? "md:grid-cols-2" : ""}`}>
        {description && (
          <p className="text-sm text-[var(--cm-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
        <ul className="space-y-2">
          {articles.map((doc) => (
            <ArticleEntry key={doc.slug} doc={doc} detailed={detailed} />
          ))}
        </ul>
      </div>
    </div>
  )
}

// A section-level item with no children of its own — a standalone page rather than a
// category. Same left-description/right-link column layout as a category block, just with
// a single link on the right instead of a list.
function StandaloneLink({ item, description }: { item: NavChild; description?: string }) {
  if (!description) {
    return (
      <div className="py-3 first:pt-0">
        <ArticleLink doc={item} />
      </div>
    )
  }

  return (
    <div className="py-3 first:pt-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <p className="text-sm text-[var(--cm-text-secondary)] leading-relaxed">
          {description}
        </p>
        <ArticleLink doc={item} />
      </div>
    </div>
  )
}

export function SectionCards({ entry }: { entry: NavEntry | NavChild }) {
  // `section` only ever exists on a top-level NavEntry — a nested NavChild (e.g. a landing
  // page several levels deep) can only use `children`.
  // `section` — ALL CAPS categories in the sidebar. Rendered in nav.yml order: each item with
  // its own children becomes a labeled category block — previewed here (detailed=false), so
  // its own children show as plain links/descriptions but never expand further — each leaf
  // item a standalone link.
  if ("section" in entry && entry.section && entry.section.length > 0) {
    return (
      <div className="mt-8">
        {entry.section.map((item) =>
          item.children && item.children.length > 0 ? (
            <CategoryBlock
              key={item.slug}
              title={item.label}
              description={resolveDescription(item)}
              articles={item.children}
            />
          ) : (
            <StandaloneLink key={item.slug} item={item} description={resolveDescription(item)} />
          )
        )}
      </div>
    )
  }

  // `children` — a plain collapsible row in the sidebar, no category label. This is always
  // the CURRENT page's own entry (the page header above already shows its title/description,
  // so no title/description passed here) — its children ARE the page's content, so the full
  // tree renders with descriptions (detailed=true).
  if (entry.children && entry.children.length > 0) {
    return (
      <div className="mt-8">
        <CategoryBlock articles={entry.children} detailed />
      </div>
    )
  }

  return null
}
