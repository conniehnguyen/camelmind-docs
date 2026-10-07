"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"

export type Tier = {
  label: string
  scope: string
  price: string
  delivery: string
  note?: string
}

export type ProcessStep = {
  step: string
  label: string
  detail: string
}

export type Package = {
  id: string
  name: string
  tagline: string
  description: string
  tiers: Tier[]
  included: string[]
  notIncluded: string[]
  terms?: { label: string; detail: string }[]
  process: ProcessStep[]
  oneLiner: string
  callout?: string
}

const mono = "font-mono"

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${mono} text-[11px] tracking-[1.2px] uppercase text-[var(--cm-text-muted)] font-medium`}>
      {children}
    </div>
  )
}

function PackageTabs({ packages, activeId, onSelect }: { packages: Package[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {packages.map((p, i) => {
        const on = p.id === activeId
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(p.id)}
            className={`text-left flex flex-col gap-1.5 rounded-lg border px-5 py-4 transition-colors ${
              on
                ? "bg-[var(--cm-oasis-teal)] border-[var(--cm-oasis-teal)] text-white"
                : "bg-[var(--cm-bg-secondary)] border-[var(--cm-border)] text-[var(--cm-text-primary)] hover:border-[var(--cm-oasis-teal)]"
            }`}
          >
            <span className={`${mono} text-[11px] tracking-wide uppercase ${on ? "text-white/60" : "text-[var(--cm-text-muted)]"}`}>
              0{i + 1} · Package
            </span>
            <span className="text-lg font-semibold">{p.name}</span>
            <span className={`text-sm leading-snug ${on ? "text-white/80" : "text-[var(--cm-text-secondary)]"}`}>{p.tagline}</span>
          </button>
        )
      })}
    </div>
  )
}

function TierCard({ tier, n }: { tier: Tier; n: number }) {
  const quoted = tier.price.toLowerCase() === "quoted"
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-bg-primary)] p-5 min-h-[180px]">
      <div className="flex items-baseline justify-between">
        <span className={`${mono} text-[11px] text-[var(--cm-text-muted)]`}>{String(n).padStart(2, "0")}</span>
        <span className="text-sm font-medium text-[var(--cm-text-secondary)]">{tier.label}</span>
      </div>
      <div className="text-sm text-[var(--cm-text-muted)] leading-snug min-h-[36px]">{tier.scope}</div>
      <div className={`text-3xl font-semibold tracking-tight ${quoted ? "text-[var(--cm-text-muted)]" : "text-[var(--cm-text-primary)]"}`}>
        {tier.price}
      </div>
      <div className="text-xs text-[var(--cm-text-muted)] -mt-1">{tier.delivery}</div>
      {tier.note && (
        <div className="mt-1 pt-3 border-t border-[var(--cm-border)] text-xs text-[var(--cm-text-muted)] leading-relaxed">
          {tier.note}
        </div>
      )}
    </div>
  )
}

function ListColumn({ kind, items }: { kind: "included" | "not-included"; items: string[] }) {
  const isOk = kind === "included"
  return (
    <div>
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--cm-border)]">
        <span className={`${mono} text-[11px] tracking-[1.2px] uppercase font-medium ${isOk ? "text-[var(--cm-text-primary)]" : "text-[var(--cm-text-muted)]"}`}>
          {isOk ? "Included" : "Not included"}
        </span>
        <span className="text-[11px] text-[var(--cm-text-muted)]">{items.length}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[18px_1fr] gap-3 text-sm leading-relaxed">
            <span className="pt-0.5">
              {isOk ? (
                <Check size={14} strokeWidth={2} className="text-[var(--cm-oasis-teal)]" />
              ) : (
                <X size={14} strokeWidth={2} className="text-[var(--cm-text-muted)]" />
              )}
            </span>
            <span className={isOk ? "text-[var(--cm-text-secondary)]" : "text-[var(--cm-text-muted)]"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stepper({ steps }: { steps: ProcessStep[] }) {
  return (
    <div>
      <Eyebrow>How it works</Eyebrow>
      <div className="relative mt-5">
        <div className="hidden sm:block absolute top-[14px] left-[14px] right-[14px] h-px bg-[var(--cm-border)]" />
        <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-5">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col gap-3">
              <div className={`${mono} w-7 h-7 rounded-full border border-[var(--cm-border)] bg-[var(--cm-bg-primary)] flex items-center justify-center text-xs font-semibold text-[var(--cm-text-secondary)]`}>
                {s.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--cm-text-primary)] mb-1">{s.label}</div>
                <div className="text-[13px] text-[var(--cm-text-muted)] leading-relaxed">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PackageDetail({ pkg }: { pkg: Package }) {
  return (
    <article className="flex flex-col gap-10">
      <header>
        <Eyebrow>{pkg.id}</Eyebrow>
        <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cm-text-primary)] mt-3 mb-3">
          {pkg.name}
        </h3>
        <p className="text-lg text-[var(--cm-text-secondary)] leading-relaxed max-w-2xl">{pkg.description}</p>
      </header>

      <section>
        <div className="flex items-baseline justify-between pb-3 mb-4 border-b border-[var(--cm-border)]">
          <Eyebrow>Pricing</Eyebrow>
          <span className={`${mono} text-xs text-[var(--cm-text-muted)]`}>{pkg.tiers.length} tiers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pkg.tiers.map((t, i) => (
            <TierCard key={t.label} tier={t} n={i + 1} />
          ))}
        </div>
      </section>

      {pkg.callout && (
        <div className="flex gap-3 items-start rounded-lg border border-[var(--cm-note-border)] bg-[var(--cm-note-bg)] px-5 py-4 text-sm leading-relaxed text-[var(--cm-text-primary)]">
          <span className="shrink-0 w-[18px] h-[18px] mt-0.5 rounded bg-[var(--cm-oasis-teal)] text-white text-[11px] font-bold flex items-center justify-center">!</span>
          <span>{pkg.callout}</span>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        <ListColumn kind="included" items={pkg.included} />
        <ListColumn kind="not-included" items={pkg.notIncluded} />
      </section>

      {pkg.terms && (
        <div className="rounded-lg border border-[var(--cm-border)] overflow-hidden">
          <div className={`${mono} px-4 py-3 bg-[var(--cm-bg-secondary)] border-b border-[var(--cm-border)] text-[11px] tracking-[1.2px] uppercase font-medium text-[var(--cm-text-secondary)]`}>
            Terms
          </div>
          {pkg.terms.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-4 px-4 py-3.5 text-sm ${i < pkg.terms!.length - 1 ? "border-b border-[var(--cm-border)]" : ""}`}
            >
              <div className="text-[var(--cm-text-muted)] font-medium">{row.label}</div>
              <div className="text-[var(--cm-text-secondary)] leading-relaxed">{row.detail}</div>
            </div>
          ))}
        </div>
      )}

      <section>
        <Stepper steps={pkg.process} />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-8 items-start border-t border-b border-[var(--cm-border)] py-8">
        <div className={`${mono} text-[11px] tracking-[1.2px] uppercase font-medium text-[var(--cm-text-muted)] pt-1.5`}>
          The summary
        </div>
        <p className="text-xl leading-relaxed text-[var(--cm-text-primary)] max-w-2xl">{pkg.oneLiner}</p>
      </div>
    </article>
  )
}

export function ServicesSection({ packages }: { packages: Package[] }) {
  const [activeId, setActiveId] = useState(packages[0].id)
  const active = packages.find((p) => p.id === activeId) ?? packages[0]

  return (
    <div className="flex flex-col gap-10">
      <PackageTabs packages={packages} activeId={activeId} onSelect={setActiveId} />
      <PackageDetail pkg={active} />
    </div>
  )
}
