export function Badge({ children }: { children: string }) {
  return (
    <span
      className="shrink-0 normal-case tracking-normal text-xs font-medium px-1.5 py-0.5 rounded-full border"
      style={{
        borderColor: "var(--cm-warning-border)",
        backgroundColor: "var(--cm-warning-bg)",
        color: "var(--cm-warning-icon)",
      }}
    >
      {children}
    </span>
  )
}
