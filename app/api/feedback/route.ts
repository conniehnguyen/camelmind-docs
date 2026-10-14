import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.FEEDBACK_EMAIL_TO
  if (!apiKey || !to) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 })
  }

  const { rating, reason, allowFollowUp, email, pageTitle, pageSlug } = await req.json()

  const ratingLabel = rating === "positive" ? "👍 Helpful" : "👎 Not helpful"

  const resend = new Resend(apiKey)
  const from = process.env.FEEDBACK_EMAIL_FROM ?? "CamelMind Doc Feedback <onboarding@resend.dev>"

  try {
    await resend.emails.send({
      from,
      to,
      ...(allowFollowUp && email ? { replyTo: email } : {}),
      subject: `Doc feedback: ${ratingLabel} — ${pageTitle}`,
      text: [
        `Rating: ${ratingLabel}`,
        `Page: ${pageTitle}`,
        `Path: ${pageSlug}`,
        `Reason: ${reason || "—"}`,
        `Follow-up OK: ${allowFollowUp ? "Yes" : "No"}`,
        ...(allowFollowUp && email ? [`Email: ${email}`] : []),
      ].join("\n"),
    })
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
