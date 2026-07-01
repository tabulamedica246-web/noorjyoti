import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Flame, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  buildSignupMailto,
  deliverSignup,
  enqueueSignup,
  getSignupEndpoint,
  type SignupEntry,
  type SignupRole,
} from "@/lib/signup-queue";

const CONSENT_TEXT =
  "I consent to Noorjyoti contacting me about this service and storing the information I provide. I understand this is an early-access sign-up. I can withdraw at any time.";

// Pragmatic email check — good enough for client-side gating; the real source
// of truth is server/human follow-up.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts international formats: digits, spaces, dashes, parens, optional leading +.
function isValidPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[+\d][\d\s()\-.]*$/.test(value.trim());
}

type Errors = Partial<Record<"fullName" | "email" | "phone" | "organizationName", string>>;

export default function EarlyAccess() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<SignupRole>("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(true);

  const formRef = useRef<HTMLFormElement>(null);

  const isOrg = role === "organization";

  function validate(): Errors {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Please enter your full name.";
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!phone.trim()) next.phone = "Please enter your phone number.";
    else if (!isValidPhone(phone)) next.phone = "Please enter a valid phone number.";
    // Organization name is optional even for organizations.
    return next;
  }

  const canSubmit = consent && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field for keyboard/AT users.
      const firstKey = Object.keys(found)[0];
      const el = formRef.current?.querySelector<HTMLInputElement>(`[name="${firstKey}"]`);
      el?.focus();
      return;
    }

    setSubmitting(true);

    // (1) Persist FIRST — durability before any network I/O.
    const entry: SignupEntry = enqueueSignup({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      organizationName: isOrg ? organizationName.trim() || undefined : undefined,
      consent: true,
      source: "web/early-access",
    });

    // (2) Best-effort delivery to a configured endpoint (if any).
    let ok = false;
    if (getSignupEndpoint()) {
      ok = await deliverSignup(entry);
    }

    // (3) Regardless of outcome, show success. Keep queued on failure (already
    //     persisted) — it will be retried on next load. Offer a mailto fallback.
    setDelivered(ok);
    setMailtoHref(buildSignupMailto(entry));
    setSubmitting(false);
    setSubmitted(true);
  }

  const consentDescribedBy = useMemo(
    () => (!consent ? "consent-hint" : undefined),
    [consent],
  );

  if (submitted) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center px-4 py-20">
        <div
          className="max-w-lg w-full text-center rounded-2xl border border-border bg-card p-10"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-3">You're on the list</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Thank you for signing up for early access. We've saved your details and
            will be in touch soon.
          </p>
          {!delivered && (
            <p className="text-sm text-muted-foreground mb-6">
              If you'd like to reach us directly, you can also send us your details
              by email — we've prefilled everything for you.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {mailtoHref && (
              <Button asChild variant="outline" className="rounded-full">
                <a href={mailtoHref}>
                  <Mail className="mr-2 w-4 h-4" aria-hidden="true" />
                  Email us your details
                </a>
              </Button>
            )}
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-16 sm:py-24">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Flame className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-4xl font-bold mb-3 tracking-tight">
            Request early access
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Be among the first to experience Noorjyoti. Tell us a little about
            yourself and we'll reach out as we open the doors.
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="form-intro"
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6"
        >
          <p id="form-intro" className="sr-only">
            All fields marked required must be completed. The consent checkbox must
            be selected before you can submit.
          </p>

          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full name <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && (
              <p id="fullName-error" className="text-sm text-destructive">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-destructive">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Role toggle */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium leading-none mb-1">
              I am signing up as <span className="text-destructive" aria-hidden="true">*</span>
            </legend>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as SignupRole)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <label
                htmlFor="role-individual"
                className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value="individual" id="role-individual" />
                <span className="text-sm font-medium">Individual</span>
              </label>
              <label
                htmlFor="role-organization"
                className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value="organization" id="role-organization" />
                <span className="text-sm font-medium">Organization / Partner</span>
              </label>
            </RadioGroup>
          </fieldset>

          {/* Organization name (optional, org only) */}
          {isOrg && (
            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization name{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                autoComplete="organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          )}

          {/* Consent */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(c) => setConsent(c === true)}
                aria-required="true"
                aria-describedby={consentDescribedBy}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed font-normal cursor-pointer">
                {CONSENT_TEXT}
              </Label>
            </div>
            {!consent && (
              <p id="consent-hint" className="text-xs text-muted-foreground pl-7">
                You must consent before submitting.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              "Request early access"
            )}
          </Button>

          {/* Live region for async status announcements. */}
          <div aria-live="polite" className="sr-only">
            {submitting ? "Submitting your early-access request." : ""}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
