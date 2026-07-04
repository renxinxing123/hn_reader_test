// Thin client over the official Hacker News Firebase API, plus mapping into
// the interface contract agreed with the frontend (Suman).
//
// HN API docs: https://github.com/HackerNews/API

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

// ---- tiny in-memory TTL cache -------------------------------------------
// Keeps us from hammering the HN API (item ids barely change second-to-second).
const cache = new Map(); // key -> { value, expires }

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < nowMs()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value, ttlMs) {
  cache.set(key, { value, expires: nowMs() + ttlMs });
}

// Wrapped so the rest of the file reads clearly; Date.now is fine at runtime.
function nowMs() {
  return Date.now();
}

async function fetchJson(url, { ttlMs = 0 } = {}) {
  if (ttlMs > 0) {
    const cached = cacheGet(url);
    if (cached !== undefined) return cached;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HN API ${res.status} for ${url}`);
  }
  const json = await res.json();
  if (ttlMs > 0) cacheSet(url, json, ttlMs);
  return json;
}

// ---- feed id lists -------------------------------------------------------
const FEEDS = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
};

// Returns the full ordered array of item ids for a feed. Cached ~60s.
export async function getFeedIds(feed) {
  const path = FEEDS[feed];
  if (!path) throw new HttpError(400, `unknown feed "${feed}" (use top|new|best)`);
  return fetchJson(`${HN_BASE}/${path}.json`, { ttlMs: 60_000 });
}

// ---- raw items -----------------------------------------------------------
// Individual items cached ~5 min; scores/descendants drift slowly.
export async function getItem(id) {
  return fetchJson(`${HN_BASE}/item/${id}.json`, { ttlMs: 300_000 });
}

export async function getUser(id) {
  return fetchJson(`${HN_BASE}/user/${id}.json`, { ttlMs: 300_000 });
}

// ---- mapping into the contract shapes ------------------------------------
function domainFromUrl(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Map a raw HN item into the agreed Story object.
export function toStory(item) {
  if (!item) return null;
  const story = {
    id: item.id,
    title: item.title ?? null,
    url: item.url ?? null,
    domain: domainFromUrl(item.url),
    score: item.score ?? 0,
    by: item.by ?? null,
    time: item.time ?? null,
    descendants: item.descendants ?? 0,
    type: item.type ?? "story",
  };
  // Ask HN / text posts carry an HTML body instead of a url.
  if (item.text) story.text = item.text;
  return story;
}

// Map a raw HN comment item into the agreed Comment object, recursively
// resolving `kids` into a nested tree. Deleted/dead nodes are kept (with the
// flags) so the frontend can decide how to render them.
export async function toCommentTree(id) {
  const item = await getItem(id);
  if (!item) return null;
  const kids = Array.isArray(item.kids) ? item.kids : [];
  const children = await Promise.all(kids.map((kid) => toCommentTree(kid)));
  return {
    id: item.id,
    by: item.by ?? null,
    time: item.time ?? null,
    text: item.text ?? null,
    kids: children.filter(Boolean),
    deleted: item.deleted === true,
    dead: item.dead === true,
  };
}

// Build the top-level comment forest for a story.
export async function getComments(storyId) {
  const item = await getItem(storyId);
  if (!item) return null; // caller distinguishes "story not found"
  const kids = Array.isArray(item.kids) ? item.kids : [];
  const forest = await Promise.all(kids.map((kid) => toCommentTree(kid)));
  return forest.filter(Boolean);
}

// Simple typed error so routes can map to the right HTTP status.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
