import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { renderer } from './renderer'
import { HomePage } from './components/HomePage'
import { StatsPage } from './components/StatsPage'
import { DashboardPage } from './components/DashboardPage'

type Bindings = {
  URLS: KVNamespace
  ANALYTICS: KVNamespace
}

export type UrlData = {
  url: string
  createdAt: string
}

export type UrlEntry = {
  code: string
  url: string
  createdAt: string
  clicks: number
}

export type ClickData = {
  timestamp: string
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  latitude: string | null
  longitude: string | null
  asOrganization: string | null
  userAgent: string | null
  referer: string | null
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)

// Homepage
app.get('/', (c) => {
  return c.render(<HomePage />)
})

// Create short link
app.post('/shorten', async (c) => {
  const body = await c.req.parseBody()
  const url = body.url as string

  if (!url) {
    return c.json({ error: 'URL is required' }, 400)
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return c.json({ error: 'Invalid URL' }, 400)
  }

  const code = nanoid(6)
  const data: UrlData = {
    url,
    createdAt: new Date().toISOString()
  }

  await c.env.URLS.put(code, JSON.stringify(data))
  
  // Initialize empty analytics
  await c.env.ANALYTICS.put(`${code}:clicks`, JSON.stringify([]))

  // Add to index for dashboard
  const indexData = await c.env.URLS.get('__index')
  const index: string[] = indexData ? JSON.parse(indexData) : []
  index.unshift(code) // Add to front (newest first)
  await c.env.URLS.put('__index', JSON.stringify(index))

  const shortUrl = new URL(`/${code}`, c.req.url).toString()
  const statsUrl = new URL(`/stats/${code}`, c.req.url).toString()

  return c.json({ 
    code, 
    shortUrl,
    statsUrl,
    originalUrl: url 
  })
})

// Dashboard - list all URLs
app.get('/dashboard', async (c) => {
  const indexData = await c.env.URLS.get('__index')
  const codes: string[] = indexData ? JSON.parse(indexData) : []
  
  // Fetch all URL data and click counts
  const entries: UrlEntry[] = await Promise.all(
    codes.slice(0, 100).map(async (code) => {
      const urlData = await c.env.URLS.get(code)
      const clicksData = await c.env.ANALYTICS.get(`${code}:clicks`)
      
      if (!urlData) return null
      
      const { url, createdAt } = JSON.parse(urlData) as UrlData
      const clicks = clicksData ? JSON.parse(clicksData).length : 0
      
      return { code, url, createdAt, clicks }
    })
  ).then(results => results.filter((e): e is UrlEntry => e !== null))

  return c.render(<DashboardPage entries={entries} />)
})

// Redirect + log analytics
app.get('/:code', async (c) => {
  const code = c.req.param('code')
  
  // Skip if it's a known route
  if (code === 'stats' || code === 'shorten' || code === 'dashboard') {
    return c.notFound()
  }

  const urlData = await c.env.URLS.get(code)
  
  if (!urlData) {
    return c.notFound()
  }

  const { url } = JSON.parse(urlData) as UrlData
  
  // Log analytics (non-blocking)
  const cf = c.req.raw.cf as {
    country?: string
    city?: string
    region?: string
    timezone?: string
    latitude?: string
    longitude?: string
    asOrganization?: string
  } | undefined

  const clickData: ClickData = {
    timestamp: new Date().toISOString(),
    country: cf?.country ?? null,
    city: cf?.city ?? null,
    region: cf?.region ?? null,
    timezone: cf?.timezone ?? null,
    latitude: cf?.latitude ?? null,
    longitude: cf?.longitude ?? null,
    asOrganization: cf?.asOrganization ?? null,
    userAgent: c.req.header('user-agent') ?? null,
    referer: c.req.header('referer') ?? null
  }

  // Get existing clicks and append
  const existingClicks = await c.env.ANALYTICS.get(`${code}:clicks`)
  const clicks: ClickData[] = existingClicks ? JSON.parse(existingClicks) : []
  
  // Cap at 1000 clicks to avoid KV size limits
  if (clicks.length >= 1000) {
    clicks.shift()
  }
  clicks.push(clickData)
  
  // Store asynchronously using waitUntil
  c.executionCtx.waitUntil(
    c.env.ANALYTICS.put(`${code}:clicks`, JSON.stringify(clicks))
  )

  return c.redirect(url, 302)
})

// Stats page
app.get('/stats/:code', async (c) => {
  const code = c.req.param('code')
  
  const urlData = await c.env.URLS.get(code)
  
  if (!urlData) {
    return c.notFound()
  }

  const { url, createdAt } = JSON.parse(urlData) as UrlData
  const clicksData = await c.env.ANALYTICS.get(`${code}:clicks`)
  const clicks: ClickData[] = clicksData ? JSON.parse(clicksData) : []

  return c.render(
    <StatsPage 
      code={code} 
      originalUrl={url} 
      createdAt={createdAt}
      clicks={clicks}
    />
  )
})

export default app
