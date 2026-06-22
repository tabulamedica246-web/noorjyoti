import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      /**
       * Secondary quota key set only for anonymous requests.
       * Keyed on the real client IP (`req.ip` with trust-proxy enabled)
       * so quota is enforced even when the nj_anon cookie is not persisted.
       */
      anonIpKey?: string;
      /**
       * True only when the nj_anon cookie was freshly minted for this request
       * (i.e. no valid existing cookie was present). Used by the synthesis
       * route to restrict IP-bucket charges to new-visitor requests only, so
       * that returning anonymous visitors with a valid cookie do not drain the
       * shared per-IP quota on ordinary cache-hit playback.
       */
      anonCookieIsNew?: boolean;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId =
    (auth?.sessionClaims as { userId?: string } | undefined)?.userId ??
    auth?.userId;
  if (!userId) {
    // Dev-only bypass: only active when NODE_ENV !== "production" AND
    // the explicit ALLOW_DEV_AUTH_BYPASS flag is set. This double-gate
    // prevents an accidental preview/staging deploy (where NODE_ENV may
    // not be "production") from silently letting unauthenticated callers
    // act as a fake user.
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_AUTH_BYPASS === "1"
    ) {
      req.userId = "anon-dev-user";
      next();
      return;
    }
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}
