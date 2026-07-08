export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="timeline">
      <div className="timeline-content">
        {children}
      </div>
    </div>
  )
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function Step({ n, title, children }: { n: string | number; title: string; children: React.ReactNode }) {
  const id = slugify(String(title))
  return (
    <div className="timeline-item" id={id} data-step={n} style={{ scrollMarginTop: "5rem" }}>
      <a
        href={`#${id}`}
        className="timeline-step-anchor"
        aria-label={`Link to step ${n}: ${title}`}
      >
        {n}
      </a>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  )
}
