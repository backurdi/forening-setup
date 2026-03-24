import { NextResponse } from "next/server";

import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { createStripeConnectOnboardingLink } from "@/lib/server/payments/stripe";
import { api } from "@convex/_generated/api";

function getSettingsUrl(siteUrl: string, orgSlug: string, status?: "returned" | "error", message?: string) {
  const url = new URL("/dashboard/settings/payments", siteUrl);
  url.searchParams.set("org", orgSlug);

  if (status) {
    url.searchParams.set("stripe", status);
  }

  if (message) {
    url.searchParams.set("stripeMessage", message);
  }

  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const orgSlug = requestUrl.searchParams.get("org");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

  if (!orgSlug) {
    return NextResponse.json({ message: "Missing organization slug." }, { status: 400 });
  }

  try {
    const setup = await fetchAuthQuery(api.organizations.getStripeConnectSetup, {
      slug: orgSlug
    });
    const returnUrl = getSettingsUrl(siteUrl, orgSlug, "returned").toString();
    const onboarding = await createStripeConnectOnboardingLink({
      defaultCurrency: setup.defaultCurrency,
      existingAccountId: setup.stripeConnectAccountId || undefined,
      organizationName: setup.name,
      orgSlug: setup.slug,
      returnUrl,
      supportEmail: setup.supportEmail,
      websiteUrl: setup.websiteUrl || undefined
    });

    if (onboarding.accountId !== setup.stripeConnectAccountId) {
      await fetchAuthMutation(api.organizations.saveStripeConnectAccount, {
        orgSlug,
        stripeConnectAccountId: onboarding.accountId
      });
    }

    return NextResponse.redirect(onboarding.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe onboarding failed.";
    console.error("Stripe Connect onboarding failed", {
      message,
      orgSlug
    });

    return NextResponse.redirect(getSettingsUrl(siteUrl, orgSlug, "error", message));
  }
}
