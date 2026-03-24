import { NextResponse } from "next/server";
import { Resend } from "resend";

import { updateEmailMessageStatus } from "@/lib/server/email/resend";

function mapResendStatus(type: string) {
  if (type === "email.delivered") {
    return "delivered" as const;
  }

  if (type === "email.bounced") {
    return "bounced" as const;
  }

  if (type === "email.complained") {
    return "complained" as const;
  }

  return "sent" as const;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ message: "Missing Resend webhook secret." }, { status: 500 });
  }

  const payload = await request.text();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const event = resend.webhooks.verify({
      headers: {
        id: request.headers.get("svix-id") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? ""
      },
      payload,
      webhookSecret
    });

    const eventData =
      "data" in event && event.data && typeof event.data === "object"
        ? (event.data as unknown as Record<string, unknown>)
        : null;
    const emailId = eventData && typeof eventData.email_id === "string" ? eventData.email_id : null;

    if (emailId) {
      await updateEmailMessageStatus({
        externalEmailId: emailId,
        status: mapResendStatus(event.type)
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Resend webhook verification failed."
      },
      { status: 400 }
    );
  }
}
