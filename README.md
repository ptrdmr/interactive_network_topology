# Concourse — Interactive Network Map

**Your floor plan isn’t a static diagram anymore — it’s a living map of everything you run.**

Concourse is a blueprint-style network topology canvas: drop devices on a real floor plan, organize them into layers, and document what each piece actually does — without wrestling with a full CMDB. Built for people who need *clarity at a glance* and *notes that travel with the gear*.

### Why it’s different

- **Layers that mean something** — Group access points, drops, racks, or anything else; color-code them and write layer-level context.
- **Click to place, click to learn** — Pick an active layer, click the map, fill in the story. No spreadsheet required.
- **Server rack mode** — Mark a layer as a rack layer: one dot on the map is an enclosure; stack units inside with a visual rack layout and per-unit docs.
- **Reposition with precision** — Arrow keys nudge markers (Shift for bigger steps) when you’re fine-tuning layout.
- **Your data stays yours** — By default everything persists in the browser (`localStorage`). Optionally **sync one shared map to Supabase** so everyone sees the same layers/devices (see below). Export or import JSON anytime.

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

### Optional: shared map (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the script in `supabase/migrations/001_map_state.sql` (creates `map_state` + RLS policies for anon read/write).
3. Copy `env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **anon** / **publishable** key (Settings → API)
4. Restart `npm run dev`. The sidebar will show “Cloud sync” when env vars are present.

On **Netlify** (or similar), add the same two variables under Site settings → Environment variables.

---

## Deploy

Deploy anywhere that hosts Next.js (e.g. [Vercel](https://vercel.com), [Netlify](https://www.netlify.com)). Without Supabase env vars, the app uses **localStorage only**; with them, the map **syncs to Postgres** for all visitors.

**Netlify:** connect the Git repo and use the included **`netlify.toml`** (Next.js plugin, `npm run build`, Node 20). Add the same Supabase `NEXT_PUBLIC_*` variables in the site’s environment settings—see comments at the top of `netlify.toml`.

---

*Draw the network. Document the reality. Ship it.*
