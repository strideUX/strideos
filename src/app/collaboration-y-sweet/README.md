# Y‑Sweet Collaboration Test

This route demonstrates real-time collaborative editing in BlockNote using Y‑sweet and Y.js with an offline‑first, resilient architecture.

## Quick Start

- Install deps: `npm install`
- Dev: `npm run dev`
- Open: `/collaboration-y-sweet`
- Open in two tabs/windows, use same "Document ID" to verify real‑time sync.

## What’s Included

- Single collaborative editor powered by Y‑sweet demo server
- Multi‑section demo (separate rooms per section)
- Presence-ready setup (user name + color)
- Connection status and manual connect/disconnect demo

## Environment

By default, the demo server is used in development:

- `https://demos.y-sweet.dev/api/auth`

For production, set:

- `NEXT_PUBLIC_Y_SWEET_ENDPOINT=https://your-app.y-sweet.cloud/api/auth`

## Notes

- Components are client‑only and use dynamic import where needed.
- Designed to integrate later with Convex for permissions and metadata.
- Follows existing UI components and styling (shadcn/Tailwind).
