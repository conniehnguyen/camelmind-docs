export type ServiceBlockData = {
  n: string
  title: string
  tagline: string
  paragraphs: string[]
  listIntro: string
  items: string[]
  closing: string | React.ReactNode
}

export function ServiceBlock({ service }: { service: ServiceBlockData }) {
  return (
    <article className="grid grid-cols-1 md:grid-cols-[64px_1fr] gap-6 md:gap-10">
      <div className="font-mono text-sm font-semibold text-[var(--cm-text-muted)]">{service.n}</div>
      <div className="flex flex-col gap-5 pb-14 border-b border-[var(--cm-border)] last:border-b-0 last:pb-0">
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--cm-text-primary)]">
          {service.title}
        </h3>
        <p className="text-xl leading-relaxed text-[var(--cm-text-primary)] font-medium">
          {service.tagline}
        </p>
        {service.paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-[var(--cm-text-secondary)]">{p}</p>
        ))}
        <div>
          <p className="text-sm font-medium text-[var(--cm-text-primary)] mb-3">{service.listIntro}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {service.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--cm-text-secondary)]">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--cm-oasis-teal)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-base leading-relaxed text-[var(--cm-text-primary)] font-medium">
          {service.closing}
        </p>
      </div>
    </article>
  )
}
