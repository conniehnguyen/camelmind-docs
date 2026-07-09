import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const { rating, reason, allowFollowUp, pageTitle, pageSlug } = await req.json()

  const emoji = rating === "positive" ? "👍" : "👎"
  const ratingLabel = rating === "positive" ? "Helpful" : "Not helpful"

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *Doc Feedback — ${ratingLabel}*`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Page:*\n${pageTitle}` },
            { type: "mrkdwn", text: `*Path:*\n\`${pageSlug}\`` },
            { type: "mrkdwn", text: `*Reason:*\n${reason || "—"}` },
            { type: "mrkdwn", text: `*Follow-up OK:*\n${allowFollowUp ? "Yes" : "No"}` },
          ],
        },
      ],
    }),
  })

  return NextResponse.json({ ok: true })
}
