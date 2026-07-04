# HN Reader — Backend

REST API for the Hacker News reader. Proxies the official
[HN Firebase API](https://github.com/HackerNews/API) into the interface contract
agreed with the frontend.

## Run

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, with --watch reload
```

Env vars:

- `PORT` — listen port (default `3000`)
- `CORS_ORIGINS` — comma-separated allowed origins (default `http://localhost:5173`)

## Interface contract

Every response is JSON with the envelope:

```json
{ "data": <payload | null>, "error": <string | null> }
```

List endpoints add `page`, `limit`, `hasMore`.

### `GET /api/stories?feed=top|new|best&page=1&limit=30`

Paginated story list. `limit` clamped to 100.

```json
{ "data": [ Story, ... ], "error": null, "page": 1, "limit": 30, "hasMore": true }
```

### `GET /api/stories/:id`

Single story. `404` if not found.

### `GET /api/stories/:id/comments`

Fully nested comment forest (array of top-level `Comment` trees). `404` if the
story isn't found.

### `GET /api/users/:id`

Raw HN user profile. `404` if not found.

### `GET /api/health`

`{ "data": { "status": "ok" }, "error": null }`

## Shapes

**Story**

```json
{ "id": 123, "title": "…", "url": "https://…", "domain": "example.com",
  "score": 512, "by": "pg", "time": 1783000000, "descendants": 88, "type": "story" }
```

`url` / `domain` are `null` for Ask HN / text posts; those carry a `text` (HTML) field.
`time` is raw Unix seconds — the frontend formats it.

**Comment** (nested)

```json
{ "id": 456, "by": "user", "time": 1783000000, "text": "<p>…html…</p>",
  "kids": [ Comment, ... ], "deleted": false, "dead": false }
```

## Notes

- In-memory TTL cache: feed id lists ~60s, items/users ~5min, to avoid hammering
  the upstream HN API.
- Comment trees are resolved recursively with parallel fetches per level.
