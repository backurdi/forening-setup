import { redirect } from "next/navigation";

type JoinSuccessPageProps = {
  params: Promise<{
    orgSlug: string;
  }>;
};

export default async function JoinSuccessPage({ params }: JoinSuccessPageProps) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/join?success=1`);
}
