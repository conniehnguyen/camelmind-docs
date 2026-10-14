import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.FEEDBACK_EMAIL_TO
  if (!apiKey || !to) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 })
  }

  const { name, email, company, projectType, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  const from = process.env.FEEDBACK_EMAIL_FROM ?? "CamelMind Work With Us <onboarding@resend.dev>"

  const projectTypeLabel: Record<string, string> = {
    migration: "Migration (into or out of CamelMind)",
    build: "Documentation Build",
    retainer: "Retainer / ongoing support",
    "not-sure": "Not sure yet",
  }

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Work with us: ${name}${company ? ` (${company})` : ""}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "—"}`,
        `Project type: ${projectTypeLabel[projectType] ?? projectType}`,
        "",
        message,
      ].join("\n"),
    })
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
