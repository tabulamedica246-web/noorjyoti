/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through your domain, enabling Clerk
 * authentication on custom domains and .replit.app deployments without
 * requiring CNAME DNS configuration.
 *
 * AUTH CONFIGURATION: To manage users, enable/disable login providers
 * (Google, GitHub, etc.), change app branding, or configure OAuth credentials,
 * use the Auth pane in the workspace toolbar. There is no external Clerk
 * dashboard — all auth configuration is done through the Auth pane.
 *
 * IMPORTANT:
 * - Only active in production (Clerk proxying doesn't work for dev instances)
 * - Must be mounted BEFORE express.json() middleware
 * - Set the CLERK_PROXY_URL environment variable to the full public proxy URL
 *   (e.g. https://noorjyoti.com/api/__clerk). This value is used verbatim as
 *   the Clerk-Proxy-Url header and must never be derived from request headers.
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler } from "express";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Returns the trusted Clerk proxy URL from server-side configuration.
 *
 * The value comes exclusively from the CLERK_PROXY_URL environment variable,
 * which must be set at deployment time to the full public URL of this proxy
 * (e.g. https://noorjyoti.com/api/__clerk).
 *
 * Request headers such as X-Forwarded-Host and X-Forwarded-Proto are NOT used
 * because they can be spoofed by an attacker to redirect Clerk's handshake to
 * an attacker-controlled origin. Only trusted server-side configuration is
 * acceptable for this security-sensitive value.
 */
export function getClerkProxyUrl(): string | undefined {
  return process.env.CLERK_PROXY_URL?.trim() || undefined;
}

export function clerkProxyMiddleware(): RequestHandler {
  // Only run proxy in production — Clerk proxying doesn't work for dev instances
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  const clerkProxyUrl = getClerkProxyUrl();
  if (!clerkProxyUrl) {
    console.warn(
      "[clerkProxy] CLERK_PROXY_URL is not set. " +
        "Clerk-Proxy-Url header will not be forwarded. " +
        "Set CLERK_PROXY_URL to the full public proxy URL " +
        "(e.g. https://noorjyoti.com/api/__clerk).",
    );
  }

  return createProxyMiddleware({
    target: CLERK_FAPI,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        if (clerkProxyUrl) {
          proxyReq.setHeader("Clerk-Proxy-Url", clerkProxyUrl);
        }
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        // Use only the server-observed socket peer address as the forwarded IP.
        // X-Forwarded-For from the incoming request is intentionally ignored:
        // it is attacker-controlled and would let callers spoof arbitrary IPs,
        // bypassing Clerk's per-IP rate limits on sign-in/sign-up endpoints.
        const clientIp = req.socket?.remoteAddress;
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
    },
  }) as RequestHandler;
}
