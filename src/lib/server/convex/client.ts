import { fetchMutation, fetchQuery } from "convex/nextjs";

import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";

export { fetchAuthMutation, fetchAuthQuery, fetchMutation as fetchPublicMutation, fetchQuery as fetchPublicQuery };
