# Optify

Optify is a clean MVP for an A/B testing SaaS that supports Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud, and custom storefronts.

## What is included

- Next.js App Router SaaS dashboard
- Supabase-ready schema with RLS
- Project, experiment, installation, billing, and AI suggestion flows
- Sticky browser SDK with DOM mutation and event ingestion
- Stats API and winner visualization
- Demo fallback data so the UI renders even before backend setup

## Stack

- Next.js 15 + React 19
- Tailwind CSS + lightweight shadcn-style UI primitives
- Supabase for auth, data, storage, and RLS
- OpenAI for A/B test suggestions
- Stripe-ready billing page scaffolding
- Vercel-friendly deployment structure

## Local setup

Important:

- Use Node 22 LTS
- Avoid running this project from an iCloud-synced `Documents` folder if possible, because file reads can timeout and cause random Next/npm corruption symptoms
- For the most stable behavior, keep the project in a fully local path

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Optional: set up Supabase and apply the schema in [`supabase/schema.sql`](/Users/nabildoueiri/Documents/AppABTEST/supabase/schema.sql).

## Production deployment

For Shopify installs, session replay, live picker, and recommendation injection, use a stable public URL instead of `ngrok`.

Recommended stack:

- Vercel for the Next.js app
- Supabase for database/auth/storage
- Your own HTTPS domain for Optify

### 1. Prepare environment variables

Set these in your hosting provider:

```bash
NEXT_PUBLIC_APP_URL=https://your-optify-domain.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

Minimum required for a stable production install:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Deploy the app

The repo is already compatible with a standard Next.js deployment:

```bash
npm install
npm run build
```

If build succeeds, deploy it to Vercel or another Node-compatible host.

Important:

- Use Node `22`
- Set the production domain in `NEXT_PUBLIC_APP_URL`
- Do not keep the Shopify snippet pointed at a tunnel URL once production is live

### 3. Apply the database schema

Create a Supabase project, then apply [`supabase/schema.sql`](/Users/douei/Documents/GPT/AppABTEST/supabase/schema.sql).

Without Supabase, the app falls back to `.optify/dev-store.json`, which is not appropriate for production.

### 4. Connect Shopify again after deploy

Once Optify has a stable public URL:

1. Open the Shopify installation flow in Optify
2. Copy the updated Liquid snippet / script tag
3. Paste it into the Shopify theme
4. Save and publish

This matters because the storefront SDK must load from the final production domain.

### 5. Verify the production install

After deployment, check these flows on a real Shopify page:

1. The SDK loads from `/optify-sdk.js`
2. `page_view` events appear in Optify
3. The live picker opens the storefront and returns the selector
4. Recommendation experiments in `running` status inject on the target page
5. Session recordings and heatmaps populate from new visits

### 6. Shopify-specific notes

- The live picker, replay capture, recommendation rendering, and event ingestion all depend on a stable HTTPS URL
- If the domain changes, re-copy the Shopify snippet so the storefront points to the correct SDK origin
- Recommendation payloads are resolved server-side from the saved Shopify connection, then rendered client-side by the SDK

## Suggested production path

If you want the fastest path to a stable setup:

1. Create a Supabase project
2. Deploy this repo to Vercel
3. Set `NEXT_PUBLIC_APP_URL` to the Vercel/custom domain
4. Apply `supabase/schema.sql`
5. Reconnect Shopify in Optify
6. Reinstall the Shopify snippet

At that point, you can stop depending on `ngrok`.

## Real creation flows

- Project creation is now wired through `POST /api/projects`
- Experiment creation is now wired through `POST /api/projects/:projectId/experiments`
- Without Supabase, writes are persisted in `.optify/dev-store.json`

## Seed data

Reset local demo storage:

```bash
npm run seed:local
```

Seed Supabase after `.env.local` is configured:

```bash
npm run seed
```

## Sandbox

Use the built-in product sandbox:

```text
http://localhost:3000/products/demo
```

It loads the SDK for `proj_1`, applies DOM mutations on matching selectors, and sends click/conversion events into the local dev store or Supabase.

## Supabase wiring

- Add your project URL and anon key to `.env.local`.
- Add the service role key for server-side event ingestion and admin queries.
- Create a `users` row after signup, or attach a trigger from `auth.users`.
- Use the provided RLS policies as the baseline security model.

## SDK install

Paste this into the target storefront:

```html
<script src="http://localhost:3000/optify-sdk.js" data-project="YOUR_PROJECT_ID"></script>
```

Supported DOM changes:

- `text`
- `cta`
- `visibility`
- `style`

Track custom conversions with:

```js
window.optify.track("conversion", { experimentId: "exp_123" });
```

## Product notes

- The UI uses demo data until Supabase env vars are configured.
- Auth pages are wired for Supabase usage, but the actual client-side auth actions are intentionally minimal in this MVP.
- Billing UI is ready for Stripe checkout/session wiring.
- Heatmaps, feature flags, and auto-stop significance logic are natural next additions after the MVP.
