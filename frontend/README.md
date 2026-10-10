# Yaka Marché — storefront

The Next.js storefront and the Express/MongoDB API run together on the
**existing Render Web Service**. Express keeps ownership of `/api/*` and
`/sitemap.xml`; Next.js serves the marketplace pages and assets. The existing
domain and MongoDB database do not need to move, and no second web service is
required.

The storefront includes the catalogue, seller listings, accounts, orders with
manual payments, buyer/seller messaging, paid listing promotion and admin
approval, favorites, search alerts, referrals, seller profiles/reviews,
password recovery, and legal pages.

## Local development

Use Node.js 20.9 or newer. The combined server needs dependencies from both
packages:

```bash
cd backend
npm install
npm run build
```

Set the existing backend variables in `backend/.env`, including
`MONGODB_URI` and `JWT_SECRET`. For local SSR/API requests, set
`MARKETPLACE_API_URL=http://localhost:5000/api` and
`NEXT_PUBLIC_API_URL=http://localhost:5000/api` in that file before building.
Then run `npm start`; Express and Next.js share the configured `PORT` (5000 by
default).

## Deploy on the existing Render service

In the existing Render Web Service settings, keep the current service, domain,
and database. Configure:

- **Root Directory:** repository root (leave the field empty), so Render can
  access both `backend/` and `frontend/`
- **Build Command:** `npm ci --prefix backend && npm ci --include=dev --prefix frontend && npm run build --prefix frontend`
- **Start Command:** `npm start --prefix backend`
- **Health Check Path:** `/api/health`
- **Node version:** 20.9 or newer (the backend package declares this minimum)

The build command installs the frontend lockfile dependencies and builds
Next.js; the start command runs the combined Express/Next.js server on Render's
`PORT`. Do not run `next start` as a second process or create another service
for the storefront.

Keep the existing production `MONGODB_URI` unchanged. Set or verify these
Render environment variables before deploying:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Existing production MongoDB connection string; do not replace it |
| `JWT_SECRET` | Existing signing secret; do not rotate as part of this deployment |
| `APP_URL` | `https://yaka-marche.xyz` |
| `CORS_ORIGIN` | `https://yaka-marche.xyz` |
| `MARKETPLACE_API_URL` | `https://yaka-marche.xyz/api` |
| `NEXT_PUBLIC_API_URL` | `https://yaka-marche.xyz/api` |
| `ADMIN_EMAIL` | Email authorized for the admin dashboard |
| `BOOST_PRICE_FCFA` | Production promotion price |
| `MOMO_NUMBER`, `MOMO_NAME` | Correct Mobile Money payment recipient |
| `CRYPTO_NETWORK`, `CRYPTO_ADDRESS`, `CRYPTO_AMOUNT` | Correct optional crypto payment details |

`NEXT_PUBLIC_API_URL` is embedded into browser bundles at build time, so set it
in Render before triggering the deployment. Keep the existing mail variables
(`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`) if password recovery
and transactional email are in use. Never replace production payment details
with the example values in `.env.example`.

## Safe release and rollback

1. Commit/push the changes to the branch connected to the existing Render
   service. No MongoDB migration or database replacement is part of this
   release.
2. Confirm the Render root directory and commands above, and verify all
   environment values. Trigger a deploy and wait for the build and health check
   to succeed.
3. Verify `https://yaka-marche.xyz/`, `/annonces`, `/api/health`,
   `/sitemap.xml`, sign-in, listing detail, and the buyer/seller/admin flows
   with test accounts. Confirm manual payments and promotion approval still use
   the configured payment instructions.
4. If the deploy fails, use Render's deploy history to roll back to the prior
   successful deploy. Leave the existing MongoDB database, Render service, and
   domain in place.

Legacy `.html` links and `/annonce?id=...` or `/annonceur?id=...` links
permanently redirect to their new storefront routes.

## Manual order payments

The buyer pays the seller directly by an agreed method and reports the payment.
The seller independently verifies receipt and confirms it in **Mes commandes**.
Yaka Marché does not collect, hold, or automatically verify order payments.
