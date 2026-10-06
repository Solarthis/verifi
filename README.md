# Verifi

A concept product for finding and verifying local businesses in Guyana:
the problem, the proposed verification model, and the interface.

A single self-contained page. No build step and no backend.

---

Built by Michael A. Thom, MAT Solutions, Guyana. <https://matsolutions.gy>

## Prototype behavior

The waitlist is a clearly labelled interface preview. It has no submission backend
and does not save or send email addresses. Its confirmation must not be treated as
an actual subscription.

Theme storage failure and an unavailable animation CDN no longer prevent basic
controls from working. The modal traps keyboard focus, restores it on close and
resets synchronously when reopened. Reduced-motion preferences skip optional
animation setup. The mobile menu supports Escape.

## Development checks

No runtime build step is needed. Optional regression tests use Node 24 and a
locked development-only jsdom dependency: `npm ci --ignore-scripts && npm test`.
These are DOM behavior tests, not native browser rendering or accessibility certification.
