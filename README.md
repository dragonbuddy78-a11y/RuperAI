# RepurAI

**AI-powered content repurposing + monetization platform.**

Turn one piece of content into dozens of platform-ready assets — plus a Monetization Studio for sales funnels, email sequences, and revenue strategies.

## Quick Start (100% Free to Try)

```powershell
cd C:\Users\goatd\projects\repurai
npm install
copy .env.example .env.local
```

### 1. Free AI (pick one — no credit card)

| Provider | Sign up | Env var |
|----------|---------|---------|
| **Groq** (recommended) | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY` |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` |
| xAI Grok (paid) | [console.x.ai](https://console.x.ai/) | `XAI_API_KEY` |

Set `AI_PROVIDER=groq` (or leave blank — auto-picks first available key).

### 2. Database

**Local (fastest):**
```powershell
npx prisma dev          # starts local Postgres
npx prisma db push      # sync schema
```

**Or Neon (free cloud):** [neon.tech](https://neon.tech) → copy connection string to `DATABASE_URL`.

### 3. Auth secret

```powershell
# Generate: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
```

### 4. Run

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign up → `/studio`

---

## Lemon Squeezy Billing (Optional)

RepurAI uses **Lemon Squeezy** instead of Stripe — great for indie SaaS (simpler setup, handles tax/VAT).

1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a **Product** → **Variant** at $29/month (Pro plan)
3. Copy IDs to `.env.local`:

```env
LEMONSQUEEZY_API_KEY="..."
LEMONSQUEEZY_STORE_ID="12345"
LEMONSQUEEZY_VARIANT_ID_PRO="67890"
LEMONSQUEEZY_WEBHOOK_SECRET="..."
```

4. Create webhook in Lemon Squeezy dashboard:
   - URL: `https://yourdomain.com/api/webhooks/lemonsqueezy`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`

5. For local testing, use [ngrok](https://ngrok.com) or deploy to Vercel first.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `AUTH_SECRET` | Yes | JWT secret |
| `GROQ_API_KEY` | One AI key | Free Groq API (recommended) |
| `GEMINI_API_KEY` | One AI key | Free Google Gemini |
| `XAI_API_KEY` | Optional | Paid xAI Grok |
| `AI_PROVIDER` | No | `groq`, `gemini`, or `xai` |
| `LEMONSQUEEZY_*` | For billing | Lemon Squeezy keys |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob |

See `.env.example` for the full list.

---

## Plans

| Plan | Price | Credits/mo | Features |
|------|-------|------------|----------|
| Free | $0 | 50 | 3 formats/request |
| Pro | $29/mo | 2,000 | All formats, Monetization Studio |

---

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui + Framer Motion
- Prisma + PostgreSQL
- Auth.js v5 (Google + email/password)
- **Lemon Squeezy** (billing)
- Groq / Gemini / xAI (AI)

---

## Deploy to Vercel

1. Push to GitHub → import in Vercel
2. Add all env vars from `.env.example`
3. Set webhook: `https://your-app.vercel.app/api/webhooks/lemonsqueezy`
4. Add `postinstall: prisma generate` (already in package.json)

---

Built with **Grok Build** by xAI.