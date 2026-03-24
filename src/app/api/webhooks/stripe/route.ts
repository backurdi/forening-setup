import { NextResponse } from "next/server";

import { fetchPublicMutation } from "@/lib/server/convex/client";
import { sendWelcomeMemberEmail } from "@/lib/server/email/resend";
import { constructStripeEvent } from "@/lib/server/payments/stripe";
import { extractStripeMemberPaymentSyncPayload } from "@/lib/server/payments/stripe-webhook";
import { api } from "@convex/_generated/api";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = await constructStripeEvent(payload, signature);
    const syncPayload = extractStripeMemberPaymentSyncPayload(event);

    if (syncPayload) {
      const result = await fetchPublicMutation(api.crm.syncStripeCheckoutCompleted, {
        amountMinor: syncPayload.amountMinor,
        checkoutSessionId: syncPayload.checkoutSessionId,
        currency: syncPayload.currency,
        customerId: syncPayload.customerId,
        memberId: syncPayload.memberId as never,
        paymentIntentId: syncPayload.paymentIntentId,
        personId: syncPayload.personId as never,
        subscriptionId: syncPayload.subscriptionId
      });

      if (result.memberActivatedNow && syncPayload.organizationSlug && syncPayload.customerEmail) {
        await sendWelcomeMemberEmail({
          firstName: syncPayload.firstName,
          memberId: syncPayload.memberId as never,
          orgSlug: syncPayload.organizationSlug,
          personId: syncPayload.personId as never,
          recipientEmail: syncPayload.customerEmail
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Stripe webhook failed."
      },
      { status: 400 }
    );
  }
}
