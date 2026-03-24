import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";

import authConfig from "../auth.config";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import schema from "./schema";

function getAuthBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
}

function getTrustedOrigins(request?: Request) {
  const origins = new Set<string>();
  const baseUrl = getAuthBaseUrl();

  if (baseUrl) {
    origins.add(baseUrl);
  }

  const forwardedHost = request?.headers.get("x-forwarded-host");
  const forwardedProto = request?.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    origins.add(`${forwardedProto}://${forwardedHost}`);
  }

  return Array.from(origins);
}

export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
  local: { schema },
  verbose: false
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    appName: "Forening Setup",
    baseURL: getAuthBaseUrl(),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    plugins: [convex({ authConfig })],
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: (request) => getTrustedOrigins(request)
  }) satisfies BetterAuthOptions;

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
