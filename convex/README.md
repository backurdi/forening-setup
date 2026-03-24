# Convex Boundary

Convex is used as the internal data and business-logic layer.

Important rule:

- browser clients do not call Convex directly
- `Next.js` server actions, route handlers, and server components call into Convex

This directory will eventually contain:

- `schema.ts`
- internal queries and mutations
- background job functions
- storage helpers
- payment normalization logic
