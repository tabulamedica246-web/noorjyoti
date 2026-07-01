/**
 * Fail-safe early-access signup capture.
 *
 * Design goals:
 *  1. Never lose a lead. Every submission is persisted to localStorage
 *     (`tm_signup_queue`) BEFORE any network attempt, so a failed/absent
 *     endpoint or a mid-flight crash cannot drop the data.
 *  2. Best-effort delivery. If an endpoint is configured we POST; on success
 *     the entry is marked synced. On failure it stays queued and is retried on
 *     the next app load (see `flushSignupQueue`).
 *  3. No hard dependency on a backend. If no endpoint is configured the lead is
 *     simply kept locally and the user is still shown success + offered a
 *     prefilled mailto fallback.
 *
 * All localStorage access is guarded — private-mode Safari and disabled storage
 * throw on access, and we must degrade gracefully rather than break submission.
 */

export const SIGNUP_QUEUE_KEY = "tm_signup_queue";
export const SIGNUP_CONTACT_EMAIL = "hello@noorjyoti.com";

export type SignupRole = "individual" | "organization";

export interface SignupEntry {
  /** Client-generated unique id — used for de-dup + sync tracking. */
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: SignupRole;
  /** Only meaningful when role === "organization". */
  organizationName?: string;
  consent: true;
  /** ISO timestamp of capture. */
  submittedAt: string;
  /** Where it originated (route/source), for later triage. */
  source: string;
  /** True once the entry has been accepted by the remote endpoint. */
  synced: boolean;
}

function safeGet(): SignupEntry[] {
  try {
    const raw = window.localStorage.getItem(SIGNUP_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SignupEntry[]) : [];
  } catch {
    return [];
  }
}

function safeSet(entries: SignupEntry[]): void {
  try {
    window.localStorage.setItem(SIGNUP_QUEUE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable — nothing else we can safely do */
  }
}

export function readSignupQueue(): SignupEntry[] {
  return safeGet();
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `sq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** The configured remote endpoint, if any. */
export function getSignupEndpoint(): string | undefined {
  const ep = import.meta.env.VITE_SIGNUP_ENDPOINT;
  return typeof ep === "string" && ep.trim() ? ep.trim() : undefined;
}

/**
 * Persist a new lead to the queue FIRST (before any network I/O) and return the
 * stored entry. This is the durability guarantee — call this synchronously on
 * submit before attempting delivery.
 */
export function enqueueSignup(
  data: Omit<SignupEntry, "id" | "submittedAt" | "synced" | "consent"> & {
    consent: true;
  },
): SignupEntry {
  const entry: SignupEntry = {
    id: makeId(),
    submittedAt: new Date().toISOString(),
    synced: false,
    ...data,
  };
  const queue = safeGet();
  queue.push(entry);
  safeSet(queue);
  return entry;
}

function markSynced(id: string): void {
  const queue = safeGet();
  let changed = false;
  for (const e of queue) {
    if (e.id === id && !e.synced) {
      e.synced = true;
      changed = true;
    }
  }
  if (changed) safeSet(queue);
}

/**
 * Attempt to POST a single entry to the configured endpoint.
 * Returns true if delivered (2xx), false otherwise (including no endpoint).
 * Never throws.
 */
export async function deliverSignup(entry: SignupEntry): Promise<boolean> {
  const endpoint = getSignupEndpoint();
  if (!endpoint) return false;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: entry.fullName,
        email: entry.email,
        phone: entry.phone,
        role: entry.role,
        organizationName: entry.organizationName,
        consent: entry.consent,
        submittedAt: entry.submittedAt,
        source: entry.source,
      }),
    });
    if (res.ok) {
      markSynced(entry.id);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Retry delivery for every unsynced entry. Safe to call on every app load.
 * No-ops quickly when there is nothing to send or no endpoint configured.
 */
export async function flushSignupQueue(): Promise<void> {
  if (!getSignupEndpoint()) return;
  const pending = safeGet().filter((e) => !e.synced);
  for (const entry of pending) {
    // Sequential to avoid hammering the endpoint; failures are retried next load.
    // eslint-disable-next-line no-await-in-loop
    await deliverSignup(entry);
  }
}

/** Build a prefilled mailto: fallback so the lead is never a dead end. */
export function buildSignupMailto(entry: SignupEntry): string {
  const subject = "Noorjyoti early-access sign-up";
  const lines = [
    "I would like to sign up for Noorjyoti early access.",
    "",
    `Full name: ${entry.fullName}`,
    `Email: ${entry.email}`,
    `Phone: ${entry.phone}`,
    `Role: ${entry.role === "organization" ? "Organization / Partner" : "Individual"}`,
  ];
  if (entry.role === "organization" && entry.organizationName) {
    lines.push(`Organization name: ${entry.organizationName}`);
  }
  lines.push(
    "",
    "I consent to Noorjyoti contacting me about this service and storing the information I provide. I understand this is an early-access sign-up. I can withdraw at any time.",
  );
  return `mailto:${SIGNUP_CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}
