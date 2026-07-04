// Frontend-side formatting helpers. The backend sends raw Unix seconds for
// `time` (per the contract), so time formatting lives here.

export function timeAgo(unixSeconds) {
  if (!unixSeconds) return ''
  const secs = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds))
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [name, size] of units) {
    const n = Math.floor(secs / size)
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

// Prefer the backend-provided domain; fall back to parsing the URL.
export function hostFrom(story) {
  if (story.domain) return story.domain
  if (!story.url) return null
  try {
    return new URL(story.url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
