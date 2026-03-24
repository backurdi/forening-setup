import { NextResponse } from "next/server";

import { fetchPublicMutation } from "@/lib/server/convex/client";
import { sendWelcomeMemberEmail } from "@/lib/server/email/resend";
import { constructStripeEvent } from "@/lib/server/payments/stripe";
import { api } from "@convex/_generated/api";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = await constructStripeEvent(payload, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const memberId = session.metadata?.memberId;
      const personId = session.metadata?.personId;
      const organizationSlug = session.metadata?.organizationSlug;
      const firstName = session.metadata?.firstName ?? "there";

      if (memberId && personId) {
        await fetchPublicMutation(api.crm.syncStripeCheckoutCompleted, {
          amountMinor: session.amount_total ?? 0,
          checkoutSessionId: session.id,
          currency: (session.currency ?? "dkk").toUpperCase(),
          customerId: typeof session.customer === "string" ? session.customer : undefined,
          memberId: memberId as never,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          personId: personId as never,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined
        });

        if (organizationSlug && session.customer_email) {
          await sendWelcomeMemberEmail({
            firstName,
            memberId: memberId as never,
            orgSlug: organizationSlug,
            personId: personId as never,
            recipientEmail: session.customer_email
          });
        }
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
