# FreePremium — Deploy

**Client production guide (GitHub + Vercel + Neon/Supabase + Cloudflare):**

- PDF: [`docs/FreePremium-Production-Deploy-Guide.pdf`](docs/FreePremium-Production-Deploy-Guide.pdf)
- HTML: [`docs/FreePremium-Production-Deploy-Guide.html`](docs/FreePremium-Production-Deploy-Guide.html)

**Feature overview for clients:** [`docs/FreePremium-Client-Feature-Guide.pdf`](docs/FreePremium-Client-Feature-Guide.pdf)

## Architecture (production)

| Piece | Service |
|-------|---------|
| App (Next.js + API + Admin) | **Vercel** |
| Database | **Neon** or **Supabase** Postgres (free tier OK to start) |
| Domain DNS / SSL edge | **Cloudflare** |
| Code | **GitHub** (auto-deploys to Vercel) |

Do **not** split frontend/backend across Netlify + a separate API host.

## Required environment variables

See `.env.example`. On Vercel you must set:

- `DATABASE_URL` — pooled Postgres URI  
- `DIRECT_URL` — direct (non-pooled) Postgres URI  
- `NEXT_PUBLIC_SITE_URL` — `https://yourdomain.com`  
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (password 10+ chars)  
- `SESSION_SECRET` (32+ chars; `openssl rand -base64 48`)

## Build

`npm run build` runs `prisma generate && prisma db push && next build` so Vercel creates/updates tables automatically.
