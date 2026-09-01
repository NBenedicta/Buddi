# buddi

> Grow together with your people.

Buddi is a private social accountability app for close-knit groups — friends,
students, or teammates — who want to stay consistent and support each other's
goals. Built with Next.js, Tailwind CSS, and Supabase.

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** Open the SQL Editor in your Supabase dashboard, paste
   the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it.
   This creates every table, the `profiles` auto-create trigger, all Row Level
   Security policies, realtime publications, and the `post-media` / `avatars`
   storage buckets.
3. **Set your environment variables.** Copy `.env.example` to `.env.local` and
   fill in your project's URL and anon key (Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

4. **Install dependencies and run the dev server:**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Deployment:** Vercel

## Project structure

```
src/
 ├── app/                 # Routes (App Router)
 │    ├── (auth)/         # /login, /signup
 │    ├── dashboard/      # hub, groups, goals, reflect, focus, join
 │    ├── profile/[username]/
 │    └── settings/
 ├── components/          # Navbar, AuthSplit, group/*, ui/*
 ├── hooks/                # useUser
 ├── lib/                  # supabase clients, utils
 └── types/                # shared database types
supabase/
 └── schema.sql            # tables, RLS policies, triggers, storage buckets
```

## Design system

White backgrounds with a purple gradient primary (`#7c3aed → #a855f7`),
rounded-2xl cards, gradient-initial avatars, and generous spacing throughout.
See `src/app/globals.css` for the shared gradient/card/button utilities.

##
By Benedicta Nzekwe
