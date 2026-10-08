export type PricingCard = {
  name: string
  description: string
  price: string
}

export function PricingCards({ cards }: { cards: PricingCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {cards.map((c) => (
        <div
          key={c.name}
          className="flex flex-col gap-4 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-bg-primary)] p-6"
        >
          <h4 className="text-lg font-semibold text-[var(--cm-text-primary)]">{c.name}</h4>
          <p className="text-sm leading-relaxed text-[var(--cm-text-secondary)] flex-1">{c.description}</p>
          <p className="text-xl font-semibold tracking-tight text-[var(--cm-oasis-teal)]">{c.price}</p>
        </div>
      ))}
    </div>
  )
}
