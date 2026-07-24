import { NextRequest, NextResponse } from "next/server"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.FEEDBACK_EMAIL_TO
  if (!apiKey || !to) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 })
  }

  const { rating, reason, allowFollowUp, email, pageTitle, pageSlug } = await req.json()

  const emoji = rating === "positive" ? "👍" : "👎"
  const ratingLabel = rating === "positive" ? "Helpful" : "Not helpful"

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FEEDBACK_EMAIL_FROM || "Doc Feedback <onboarding@resend.dev>",
      to,
      subject: `${emoji} Doc Feedback — ${ratingLabel}: ${pageTitle}`,
      html: `
        <p><strong>Page:</strong> ${escapeHtml(pageTitle)}</p>
        <p><strong>Path:</strong> ${escapeHtml(pageSlug)}</p>
        <p><strong>Rating:</strong> ${ratingLabel}</p>
        <p><strong>Reason:</strong> ${escapeHtml(reason || "—")}</p>
        <p><strong>Follow-up OK:</strong> ${allowFollowUp ? "Yes" : "No"}</p>
        ${allowFollowUp && email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
      `,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
