# Concourse — Interactive Network Map

**Your floor plan isn’t a static diagram anymore — it’s a living map of everything you run.**

Concourse is a blueprint-style network topology canvas: drop devices on a real floor plan, organize them into layers, and document what each piece actually does — without wrestling with a full CMDB. Built for people who need *clarity at a glance* and *notes that travel with the gear*.

### Why it’s different

- **Layers that mean something** — Group access points, drops, racks, or anything else; color-code them and write layer-level context.
- **Click to place, click to learn** — Pick an active layer, click the map, fill in the story. No spreadsheet required.
- **Server rack mode** — Mark a layer as a rack layer: one dot on the map is an enclosure; stack units inside with a visual rack layout and per-unit docs.
- **Reposition with precision** — Arrow keys nudge markers (Shift for bigger steps) when you’re fine-tuning layout.
- **Your data stays yours** — Everything persists in the browser (`localStorage`). Export or import JSON when you need a backup or a handoff.

Stack: [Next.js](https://nextjs.org) (App Router), React, TypeScript, Tailwind-friendly styling.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run production server locally
```

---

## Deploy

Deploy anywhere that hosts static or Node Next.js apps (e.g. [Vercel](https://vercel.com)). Map data is client-side only unless you add your own backend.

---

*Draw the network. Document the reality. Ship it.*
