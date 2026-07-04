// API client for the HN-reader backend contract (locked with xinxing-ren).
//
// Envelope: every response is { data: ..., error: null }.
// List responses additionally carry { page, limit, hasMore } at the top level.
// Base URL comes from VITE_API_BASE (see .env).

const BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path) {
  const res = await fetch(`${BASE}${path}`)
  let body
  try {
    body = await res.json()
  } catch {
    throw new Error(`Bad JSON from ${path} (HTTP ${res.status})`)
  }
  if (!res.ok || body.error) {
    throw new Error(body.error || `HTTP ${res.status} on ${path}`)
  }
  return body
}

// GET /api/stories?feed=top|new|best&page&limit -> { data: Story[], page, limit, hasMore }
export async function getStories({ feed = 'top', page = 1, limit = 30 } = {}) {
  const qs = new URLSearchParams({ feed, page: String(page), limit: String(limit) })
  const body = await request(`/stories?${qs}`)
  return {
    stories: body.data,
    page: body.page,
    limit: body.limit,
    hasMore: body.hasMore,
  }
}

// GET /api/stories/:id -> { data: Story }
export async function getStory(id) {
  const body = await request(`/stories/${id}`)
  return body.data
}

// GET /api/stories/:id/comments -> { data: Comment[] } (fully nested)
export async function getComments(id) {
  const body = await request(`/stories/${id}/comments`)
  return body.data
}

// GET /api/users/:id -> { data: User } (phase 2 / optional)
export async function getUser(id) {
  const body = await request(`/users/${id}`)
  return body.data
}

export const FEEDS = ['top', 'new', 'best']
