import type { ClickData } from '../index'

type Props = {
  code: string
  originalUrl: string
  createdAt: string
  clicks: ClickData[]
}

function getCountryStats(clicks: ClickData[]): { country: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {}
  
  for (const click of clicks) {
    const country = click.country || 'Unknown'
    counts[country] = (counts[country] || 0) + 1
  }

  const total = clicks.length
  return Object.entries(counts)
    .map(([country, count]) => ({
      country,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTimeAgo(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Country code to flag emoji
function countryToFlag(countryCode: string | null): string {
  if (!countryCode || countryCode === 'Unknown') return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function StatsPage({ code, originalUrl, createdAt, clicks }: Props) {
  const countryStats = getCountryStats(clicks)
  const recentClicks = [...clicks].reverse().slice(0, 20)
  const maxCount = countryStats[0]?.count || 1

  return (
    <div class="container stats-container">
      <header>
        <a href="/" class="back-link">← Back</a>
        <h1>📊 Link Analytics</h1>
      </header>

      <section class="link-info">
        <div class="stat-card code-card">
          <span class="label">Short Code</span>
          <span class="value code">/{code}</span>
        </div>
        <div class="stat-card">
          <span class="label">Original URL</span>
          <a href={originalUrl} target="_blank" class="value url" title={originalUrl}>
            {originalUrl.length > 50 ? originalUrl.slice(0, 50) + '...' : originalUrl}
          </a>
        </div>
        <div class="stat-card">
          <span class="label">Created</span>
          <span class="value">{formatDate(createdAt)}</span>
        </div>
      </section>

      <section class="stats-overview">
        <div class="big-stat">
          <span class="big-number">{clicks.length}</span>
          <span class="big-label">Total Clicks</span>
        </div>
        <div class="big-stat">
          <span class="big-number">{countryStats.length}</span>
          <span class="big-label">Countries</span>
        </div>
      </section>

      {countryStats.length > 0 && (
        <section class="country-breakdown">
          <h2>🌍 Clicks by Country</h2>
          <div class="bar-chart">
            {countryStats.map(({ country, count, percentage }) => (
              <div class="bar-row">
                <span class="bar-label">
                  {countryToFlag(country)} {country}
                </span>
                <div class="bar-track">
                  <div 
                    class="bar-fill" 
                    style={`width: ${(count / maxCount) * 100}%`}
                  />
                </div>
                <span class="bar-value">{count} ({percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section class="recent-clicks">
        <h2>⏱ Recent Clicks</h2>
        {recentClicks.length === 0 ? (
          <p class="no-data">No clicks yet. Share your link!</p>
        ) : (
          <div class="clicks-table">
            <div class="table-header">
              <span>Time</span>
              <span>Location</span>
              <span>Network</span>
            </div>
            {recentClicks.map((click) => (
              <div class="table-row">
                <span class="time" title={formatDate(click.timestamp)}>
                  {getTimeAgo(click.timestamp)}
                </span>
                <span class="location">
                  {countryToFlag(click.country)} 
                  {click.city && ` ${click.city},`}
                  {click.region && ` ${click.region},`}
                  {click.country ? ` ${click.country}` : ' Unknown'}
                </span>
                <span class="network" title={click.asOrganization || undefined}>
                  {click.asOrganization 
                    ? (click.asOrganization.length > 20 
                        ? click.asOrganization.slice(0, 20) + '...' 
                        : click.asOrganization)
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>Powered by Cloudflare Workers + KV</p>
      </footer>
    </div>
  )
}

