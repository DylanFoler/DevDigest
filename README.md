# DevDigest

Track pull request activity across your GitHub repos, generate AI-powered digests, and export clean reports. Built with Next.js, Supabase, and Claude.

## What it does

Connect any GitHub repo and generate a digest on demand. DevDigest fetches your last 30 PRs and recent CI runs, computes cycle time and PR size distribution, then uses Claude to write a technical summary covering what shipped, what is in flight, and where the risks are. If you do not have an Anthropic key it falls back to a structured summary built from the raw data.

Each digest includes:

- Merged and open PR counts with avg cycle time
- CI failure tracking by job name
- PR size breakdown (XS / S / M / L by line count)
- AI summary with specific PR numbers, titles, and authors
- Key changes and release notes sections
- PDF export with full PR list and contributor table

## Stack

- Next.js 15 (App Router)
- Supabase (Postgres, service role)
- NextAuth.js (GitHub OAuth)
- Octokit (GitHub API)
- Claude Sonnet (Anthropic SDK)
- Tailwind CSS

## Setup

**1. Clone and install**

```bash
git clone https://github.com/DylanFoler/DevDigest.git
cd DevDigest
npm install
```

**2. Create a GitHub OAuth App**

Go to github.com/settings/developers, create a new OAuth App, and set the callback URL to:

```
http://localhost:3000/api/auth/callback/github
```

**3. Create a Supabase project**

Run the schema in `supabase/schema.sql` against your project via the Supabase SQL editor.

**4. Fill in your environment variables**

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=           # generate with: openssl rand -base64 32

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=         # optional, fallback digest generated without it
```

**5. Run**

```bash
npm run dev
```

Open http://localhost:3000, sign in with GitHub, and connect a repo.

## Generating a report

Once a repo is connected, click **+ Report** on its card. DevDigest fetches the data, runs it through Claude, and saves the digest. Expand any digest to see the full PR list, contributor breakdown, and release notes. Click **PDF** to export.

## Project structure

```
app/
  api/          API routes (auth, repos, reports, digests, github)
  dashboard/    Main dashboard page
  repos/[id]/   Per-repo digest history
  settings/     Connected repos and sign out
components/     All client components
lib/
  auth.ts       NextAuth config
  claude.ts     Digest generation with fallback
  supabase.ts   Supabase admin client
  user.ts       getOrCreateUserId helper
  utils.ts      PR classification, cycle time, formatting
supabase/
  schema.sql    Database schema
```
