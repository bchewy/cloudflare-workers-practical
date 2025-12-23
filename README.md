# ⚡ Cloudflare Workers Practical Workshop

Build a **URL Shortener with Edge Analytics** using Cloudflare Workers, Hono, and KV storage.

## 🎯 What You'll Learn

- **Cloudflare Workers** — Serverless functions at the edge
- **Hono** — Lightweight, fast web framework for Workers
- **KV Storage** — Key-value storage with global replication
- **Edge Geolocation** — Free location data from every request
- **Vite + Wrangler** — Modern dev experience for Workers

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- Basic TypeScript/JavaScript knowledge

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd cloudflare-workers-practical
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` — you should see the Edge Shortener UI.

### 3. Create KV Namespaces (for deployment)

```bash
# Create namespaces
npx wrangler kv:namespace create URLS
npx wrangler kv:namespace create ANALYTICS

# Copy the IDs to wrangler.jsonc
```

### 4. Deploy

```bash
npm run deploy
```

---

## 🏗️ Project Structure

```
├── src/
│   ├── index.tsx           # Main Hono routes
│   ├── renderer.tsx        # JSX renderer setup
│   ├── style.css           # Styling
│   └── components/
│       ├── HomePage.tsx    # URL input form
│       └── StatsPage.tsx   # Analytics dashboard
├── wrangler.jsonc          # Cloudflare config
├── vite.config.ts          # Vite config
└── package.json
```

---

## 🔧 How It Works

### Architecture

```
┌─────────────┐     POST /shorten      ┌──────────────────┐
│   Browser   │ ───────────────────▶   │ Cloudflare Edge  │
└─────────────┘                        │    (Worker)      │
                                       └────────┬─────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
            ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
            │   KV: URLS   │           │ KV: ANALYTICS│           │  request.cf  │
            │  Store URLs  │           │ Store clicks │           │  Geolocation │
            └──────────────┘           └──────────────┘           └──────────────┘
```

### Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Homepage with URL input form |
| `/shorten` | POST | Create a short link |
| `/:code` | GET | Redirect to original URL + log analytics |
| `/stats/:code` | GET | View click analytics |

### Edge Geolocation

Cloudflare automatically provides geolocation data on every request via `request.cf`:

```typescript
const cf = request.cf
// cf.country  → "US"
// cf.city     → "San Francisco"
// cf.region   → "California"
// cf.timezone → "America/Los_Angeles"
// cf.latitude → "37.7749"
// cf.longitude→ "-122.4194"
// cf.asOrganization → "Cloudflare Inc"
```

**No API keys needed** — it's free and instant at every edge location.

---

## 📚 Key Concepts

### 1. Hono Framework

Hono is an ultrafast web framework designed for the edge:

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello!'))
app.post('/api', async (c) => {
  const body = await c.req.json()
  return c.json({ received: body })
})

export default app
```

### 2. KV Storage

KV is a globally distributed key-value store:

```typescript
// Write
await c.env.URLS.put('abc123', JSON.stringify({ url: 'https://...' }))

// Read
const data = await c.env.URLS.get('abc123')

// Delete
await c.env.URLS.delete('abc123')
```

### 3. Non-blocking Operations

Use `waitUntil` for fire-and-forget operations that shouldn't block the response:

```typescript
c.executionCtx.waitUntil(
  c.env.ANALYTICS.put(key, JSON.stringify(data))
)
return c.redirect(url) // Returns immediately
```

---

## 🎨 Features

- **URL Shortening** — Generate 6-character short codes with nanoid
- **Click Tracking** — Every redirect logs timestamp, location, and ISP
- **Analytics Dashboard** — View total clicks, country breakdown, recent clicks
- **Dark Mode UI** — Modern design with orange accent theme
- **Responsive** — Works on mobile and desktop

---

## 🧪 Testing Locally

The local dev server simulates Cloudflare Workers with full KV support:

```bash
npm run dev
```

Note: Geolocation data (`request.cf`) will be simulated/empty locally. Deploy to see real geo data.

---

## 🚢 Deployment Checklist

1. **Create KV namespaces:**
   ```bash
   npx wrangler kv:namespace create URLS
   npx wrangler kv:namespace create ANALYTICS
   ```

2. **Update `wrangler.jsonc`** with the namespace IDs:
   ```jsonc
   {
     "kv_namespaces": [
       { "binding": "URLS", "id": "<your-urls-id>" },
       { "binding": "ANALYTICS", "id": "<your-analytics-id>" }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Visit your Worker** at `https://cloudflare-workers-practical.<your-subdomain>.workers.dev`

---

## 📖 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [KV Storage Guide](https://developers.cloudflare.com/kv/)
- [Workers Geolocation](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)

---

## 🤝 Workshop Support

Having issues? Check:
1. Node.js version is 18+
2. You're logged into Wrangler: `npx wrangler login`
3. KV namespace IDs are correct in `wrangler.jsonc`

---

Built with ⚡ by the workshop team
