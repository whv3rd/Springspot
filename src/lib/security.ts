// Springspot Security (/security): the placeholders to fill in before the page is shared,
// in one place. Keep the bracketed values exactly as written until the real ones are
// decided; the page renders them as-is.

export const SECURITY = {
  /** Where every contact button sends people. */
  email: '[YOUR EMAIL]',
  prices: {
    spotCheck: '[YOUR PRICE]',
    fullReview: '[YOUR PRICE]',
    /** Shown with " / month" after it. */
    advisor: '[YOUR PRICE]',
  },
} as const;

/** A mailto: link to the Security inbox, with an optional subject line. */
export function securityMailto(subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${SECURITY.email}${query}`;
}

/** Header nav: in-page anchors, in page order. */
export const SECURITY_NAV = [
  { label: 'Services', href: '#services' },
  { label: 'Incident readiness', href: '#incident' },
  { label: 'How it works', href: '#how' },
  { label: 'Packages', href: '#packages' },
  { label: 'About', href: '#about' },
] as const;
