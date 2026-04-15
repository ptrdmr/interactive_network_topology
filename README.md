# Concourse — Interactive Network Map

**Your floor plan isn't a static diagram anymore — it's a living map of everything you run.**

Concourse is a blueprint-style network topology canvas: drop devices on a real floor plan, organize them into layers, and document what each piece actually does — without wrestling with a full CMDB. Built for people who need *clarity at a glance* and *notes that travel with the gear*.

### Why it's different

- **Layers that mean something** — Group access points, drops, racks, or anything else; color-code them and write layer-level context.
- **Click to place, click to learn** — Pick an active layer, click the map, fill in the story. No spreadsheet required.
- **Server rack mode** — Set a device type to **Rack** to make it an enclosure; stack units inside with a visual rack layout and per-unit docs.
- **Reposition with precision** — Arrow keys nudge markers (Shift for bigger steps) when you're fine-tuning layout.
- **Your data stays yours** — By default everything persists in the browser (`localStorage`). Optionally add **Supabase** for per-user cloud sync and authentication (see below). Export or import JSON anytime.

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

### Optional: per-user cloud sync (Supabase + Auth)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run both migration scripts in order:
   - `supabase/migrations/001_map_state.sql` — legacy shared table (safe to skip if starting fresh).
   - `supabase/migrations/002_user_map_state.sql` — creates `user_map_state` with RLS scoped to each user; renames any existing `map_state` to `map_state_shared_legacy`.
3. **Enable Auth** in the Supabase Dashboard → Authentication:
   - Enable **Email** provider (magic link) or add an OAuth provider.
   - Under **URL Configuration**, set:
     - **Site URL**: `https://your-domain.com` (or `http://localhost:3000` for local dev)
     - **Redirect URLs**: `https://your-domain.com/auth/callback`, `http://localhost:3000/auth/callback`
4. Copy `env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **anon** / **publishable** key (Settings → API)
5. Restart `npm run dev`.

**Guest vs signed-in behavior:**

| | Guest (not signed in) | Signed in |
|---|---|---|
| Data storage | Session only (lost when tab closes) | Per-user cloud row in Supabase |
| Device limit | 10 devices | No limit |
| Topology view | Not available | Full access |

**Migrating existing data:** If you have map data in `localStorage` from before auth was enabled, sign in and the app will auto-promote it to your cloud account on first login (if no cloud data exists yet). For old shared Supabase data, export the JSON from `map_state_shared_legacy` and re-import after signing in.

On **Netlify** (or similar), add the same two variables under Site settings → Environment variables.

---

## Deploy

Deploy anywhere that hosts Next.js (e.g. [Vercel](https://vercel.com), [Netlify](https://www.netlify.com)). Without Supabase env vars, the app uses **localStorage only** (no auth, no guest restrictions); with them, the app enables **per-user auth and cloud sync**.

**Netlify:** connect the Git repo and use the included **`netlify.toml`** (Next.js plugin, `npm run build`, Node 20). Add the same Supabase `NEXT_PUBLIC_*` variables in the site's environment settings—see comments at the top of `netlify.toml`.

---

*Draw the network. Document the reality. Ship it.*
