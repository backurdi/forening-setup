import { NextResponse } from "next/server";

import { createStripeMembershipCheckout } from "@/lib/server/payments/stripe";
import { submitPublicSignup } from "@/lib/server/services/signup";
import { publicMembershipSignupSchema } from "@/lib/validations/membership";

type RouteContext = {
  params: Promise<{
    formSlug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { formSlug } = await context.params;
  const body = await request.json();
  const parsed = publicMembershipSignupSchema.safeParse({
    formSlug,
    ...body
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        formSlug,
        ok: false,
        errors: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const result = await submitPublicSignup(parsed.data);

  if (result.paymentProvider === "stripe" && result.amountMinor > 0) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const checkoutSession = await createStripeMembershipCheckout({
        amountMinor: result.amountMinor,
        cancelUrl: `${siteUrl}/${result.organizationSlug}/join?canceled=1`,
        currency: result.currency,
        customerEmail: result.personEmail,
        firstName: parsed.data.firstName,
        memberId: result.memberId,
        organizationName: result.organizationName,
        organizationSlug: result.organizationSlug,
        personId: result.personId,
        planName: result.planName,
        priceId: result.stripePriceId,
        productName: result.stripeProductName,
        successUrl: `${siteUrl}/${result.organizationSlug}/join/success`
      });

      return NextResponse.json({
        message: "Redirecting to secure Stripe checkout.",
        ok: true,
        redirectUrl: checkoutSession.url
      });
    } catch (error) {
      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : "Unable to start Stripe checkout.",
          ok: false
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ...result,
    message: "Your signup was received. The organization can now handle the next membership steps from the CRM."
  });
}
