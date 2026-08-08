# FreePremium

Adult video tube CMS — Next.js 16 + Prisma + Admin panel.

## Docs

- [`docs/FreePremium-Production-Deploy-Guide.pdf`](docs/FreePremium-Production-Deploy-Guide.pdf) — GitHub + Vercel + Neon/Supabase + Cloudflare
- [`docs/FreePremium-Client-Feature-Guide.pdf`](docs/FreePremium-Client-Feature-Guide.pdf) — feature overview
- [`DEPLOY.md`](DEPLOY.md) — short deploy notes
- [`.env.example`](.env.example) — environment variables

## Local development

```bash
npm install
cp .env.example .env
# Fill required values, then:
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: `/admin/login`.
