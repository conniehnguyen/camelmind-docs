export type NavChild = {
  label: string
  slug: string
  file: string
  roles: string[]
  children?: NavChild[]
}

export type NavEntry = {
  label: string
  slug: string
  file: string
  roles: string[]
  section?: NavChild[]   // renders as ALL CAPS category block with children below
  children?: NavChild[]  // renders as a plain collapsible row (no category label)
}

export type NavGroup = {
  label: string
  dropdown: boolean
  noDropdown?: boolean  // show as direct link in top nav, not a dropdown button
  slug?: string         // href for the direct link when noDropdown is true
  items: NavEntry[]
}

export type NavConfig = {
  nav: (NavEntry | NavGroup)[]
}

export function isNavGroup(item: NavEntry | NavGroup): item is NavGroup {
  return "dropdown" in item
}
