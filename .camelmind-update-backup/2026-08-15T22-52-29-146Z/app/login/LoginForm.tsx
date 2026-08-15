"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DEMO_PERSONAS } from "@/lib/auth-providers/dev-mock"
import type { AuthProvider } from "@/lib/config-types"

function LoginFormInner({ provider }: { provider: AuthProvider }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") ?? "/home"
  const error = searchParams.get("error")
  const [loading, setLoading] = useState(false)

  async function signInWithOidc() {
    setLoading(true)
    window.location.href = `/api/auth/signin?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function signInWithPersona(persona: string) {
    setLoading(true)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, returnTo }),
    })
    const data = await res.json()
    if (data.redirectTo) router.push(data.redirectTo)
    else setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--cm-night-dune)] flex items-center justify-center px-4">
      <div className="bg-[var(--cm-bg-secondary)] border border-[var(--cm-border)] rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-2xl mb-4">
            <span className="text-[var(--cm-oasis-teal)] font-mono font-bold">&lt;</span>
            <span className="text-[var(--cm-camel-gold)]">🐪</span>
            <span className="text-[var(--cm-oasis-teal)] font-mono font-bold">&gt;</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--cm-text-primary)] font-[family-name:var(--cm-font-heading)]">CamelMind</h1>
          <p className="text-[var(--cm-text-muted)] text-sm mt-1">Doc site spun up in minutes.</p>
        </div>

        {error && (
          <p className="text-sm text-[var(--cm-danger)] bg-[var(--cm-danger-bg)] border border-[var(--cm-danger-border)] rounded-md px-3 py-2 mb-4">
            Sign-in failed. Please try again.
          </p>
        )}

        {provider === "oidc" ? (
          <div className="space-y-4">
            <p className="text-[var(--cm-text-secondary)] text-sm">
              Sign in with your organization&apos;s identity provider to access restricted documentation.
            </p>
            <button
              onClick={signInWithOidc}
              disabled={loading}
              className="w-full cm-primary-button px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Sign in with SSO"}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-[var(--cm-text-primary)] font-medium text-sm mb-1">Development sign-in</p>
              <p className="text-[var(--cm-text-muted)] text-xs">
                Choose a persona to simulate role-based access. In production, set{" "}
                <code className="text-[var(--cm-oasis-teal)]">auth.provider: &quot;oidc&quot;</code> in{" "}
                <code className="text-[var(--cm-oasis-teal)]">camelmind.config.ts</code>.
              </p>
            </div>
            <div className="space-y-3">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => signInWithPersona(persona.id)}
                  disabled={loading}
                  className="w-full text-left bg-[var(--cm-bg-tertiary)] hover:bg-[var(--cm-dune-beige)] border border-[var(--cm-border)] rounded-lg px-4 py-3 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--cm-text-primary)] text-sm font-medium">{persona.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-[var(--cm-border)] font-mono text-[var(--cm-text-muted)]">
                      {persona.badge}
                    </span>
                  </div>
                  <p className="text-[var(--cm-text-muted)] text-xs mt-0.5">{persona.description}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function LoginForm({ provider }: { provider: AuthProvider }) {
  return (
    <Suspense>
      <LoginFormInner provider={provider} />
    </Suspense>
  )
}
