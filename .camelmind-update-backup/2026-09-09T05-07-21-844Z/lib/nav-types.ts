export type NavChild = {
  label: string
  slug: string
  file: string
  roles: string[]
  children?: NavChild[]
  badge?: string  // short pill shown next to the sidebar label; defaults to the linked file's frontmatter `badge` if omitted
  description?: string  // shown on the parent section-landing page when this child is a category (has its own children)
}

export type NavEntry = {
  label: string
  slug: string
  file?: string  // omit to render a bare section-landing page (title + "In this section" only)
  roles: string[]
  hidden_from_nav?: boolean  // accessible by URL but excluded from dropdown and sidebar
  section?: NavChild[]   // renders as ALL CAPS category block with children below
  children?: NavChild[]  // renders as a plain collapsible row (no category label)
  badge?: string  // short pill shown next to the sidebar label; defaults to the linked file's frontmatter `badge` if omitted
  description?: string   // subtitle shown under the title on a section-landing page
}

export type NavGroup = {
  label: string
  dropdown: boolean
  noDropdown?: boolean  // show as direct link in top nav, not a dropdown button
  slug?: string         // optional direct-link href; falls back to the first visible item
  items: NavEntry[]
}

export type NavConfig = {
  nav: (NavEntry | NavGroup)[]
}

export function isNavGroup(item: NavEntry | NavGroup): item is NavGroup {
  return "dropdown" in item
}
