import type { Route } from "next";
import { redirect } from "next/navigation";

type EmailsRedirectPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function EmailsRedirectPage({ searchParams }: EmailsRedirectPageProps) {
  const params = await searchParams;
  const suffix = params.org ? `?org=${params.org}` : "";

  redirect(`/dashboard/settings/email${suffix}` as Route);
}
