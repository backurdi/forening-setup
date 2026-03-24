import type { NextConfig } from "next";

function readAllowedDevOrigins() {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.BETTER_AUTH_URL];
  const origins = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const url = new URL(candidate);

      if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
        origins.add(url.hostname);
      }
    } catch {
      continue;
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: readAllowedDevOrigins(),
  typedRoutes: true
};

export default nextConfig;
