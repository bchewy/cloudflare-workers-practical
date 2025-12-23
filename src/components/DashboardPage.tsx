import type { UrlEntry } from '../index'

type Props = {
  entries: UrlEntry[]
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

export function DashboardPage({ entries }: Props) {
  const totalClicks = entries.reduce((sum, e) => sum + e.clicks, 0)

  return (
    <div class="container dashboard-container">
      <header>
        <a href="/" class="back-link">← Home</a>
        <h1>📋 Dashboard</h1>
        <p class="subtitle">All your shortened URLs</p>
      </header>

      <section class="stats-overview">
        <div class="big-stat">
          <span class="big-number">{entries.length}</span>
          <span class="big-label">Total Links</span>
        </div>
        <div class="big-stat">
          <span class="big-number">{totalClicks}</span>
          <span class="big-label">Total Clicks</span>
        </div>
      </section>

      <section class="urls-list">
        <h2>🔗 All URLs</h2>
        {entries.length === 0 ? (
          <div class="no-data">
            <p>No URLs yet. <a href="/">Create your first short link!</a></p>
          </div>
        ) : (
          <div class="urls-table">
            <div class="table-header urls-header">
              <span>Short URL</span>
              <span>Original</span>
              <span>Clicks</span>
              <span>Created</span>
              <span></span>
            </div>
            {entries.map((entry) => (
              <div class="table-row urls-row">
                <span class="short-code">
                  <a href={`/${entry.code}`} target="_blank">/{entry.code}</a>
                </span>
                <span class="original-url" title={entry.url}>
                  {entry.url.length > 40 ? entry.url.slice(0, 40) + '...' : entry.url}
                </span>
                <span class="clicks-count">
                  <span class="clicks-badge">{entry.clicks}</span>
                </span>
                <span class="created-time" title={formatDate(entry.createdAt)}>
                  {getTimeAgo(entry.createdAt)}
                </span>
                <span class="actions">
                  <a href={`/stats/${entry.code}`} class="stats-btn">Stats →</a>
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

