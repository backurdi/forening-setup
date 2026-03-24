import { fetchPublicMutation } from "@/lib/server/convex/client";
import { api } from "@convex/_generated/api";
import { publicMembershipSignupSchema, type PublicMembershipSignupInput } from "@/lib/validations/membership";

export async function submitPublicSignup(input: PublicMembershipSignupInput) {
  const parsed = publicMembershipSignupSchema.parse(input);

  return fetchPublicMutation(api.publicForms.submitSignup, parsed);
}
