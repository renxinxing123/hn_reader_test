# HN Reader

A Hacker News reader — split backend (this side) + frontend (Vite), built to a
shared REST interface contract.

## Layout (monorepo)

```
/backend    Node/Express API — proxies the official HN Firebase API (see backend/README.md)
/frontend   Vite frontend (added by Suman)
```

## Running locally

Each service runs independently on your own machine.

```bash
# Terminal 1 — backend
cd backend
npm install
npm start                 # http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev               # http://localhost:5173  (Vite)
```

The backend enables CORS for `http://localhost:5173` by default. If the frontend
runs elsewhere, start the backend with `CORS_ORIGINS=<origin> npm start`.

## Interface contract

Every response uses the envelope `{ "data": <payload|null>, "error": <string|null> }`;
list endpoints add `page`, `limit`, `hasMore`. Full spec and object shapes are in
[`backend/README.md`](backend/README.md).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/stories?feed=top\|new\|best&page=1&limit=30` | paginated story list |
| GET | `/api/stories/:id` | single story |
| GET | `/api/stories/:id/comments` | fully nested comment tree |
| GET | `/api/users/:id` | user profile |
| GET | `/api/health` | health check |

Times are raw Unix seconds (frontend formats them).
