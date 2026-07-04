// HN reader backend — Express server implementing the interface contract
// agreed with the frontend (Suman). Proxies the official HN Firebase API.
//
// Envelope for every response: { "data": <payload|null>, "error": <string|null> }
// List responses additionally carry: page, limit, hasMore

import express from "express";
import cors from "cors";
import {
  getFeedIds,
  getItem,
  getUser,
  getComments,
  toStory,
  HttpError,
} from "./hn.js";

const PORT = process.env.PORT || 3000;

// Frontend dev origin(s). Suman runs Vite on 5173; allow override via env for
// other setups / eventual deploy.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));

// ---- helpers -------------------------------------------------------------
function ok(res, data, extra = {}) {
  res.json({ data, error: null, ...extra });
}

function fail(res, status, message) {
  res.status(status).json({ data: null, error: message });
}

// Parse a positive integer query param with a default and a max clamp.
function intParam(value, fallback, { min = 1, max = Infinity } = {}) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// Wrap an async route so thrown errors become clean JSON responses.
function route(handler) {
  return (req, res) => {
    Promise.resolve(handler(req, res)).catch((err) => {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      fail(res, status, err.message || "internal error");
    });
  };
}

// ---- routes --------------------------------------------------------------

// GET /api/stories?feed=top|new|best&page=1&limit=30
app.get(
  "/api/stories",
  route(async (req, res) => {
    const feed = (req.query.feed || "top").toString();
    const page = intParam(req.query.page, 1, { min: 1 });
    const limit = intParam(req.query.limit, 30, { min: 1, max: 100 });

    const ids = await getFeedIds(feed); // throws HttpError(400) on bad feed
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageIds = ids.slice(start, end);

    const items = await Promise.all(pageIds.map((id) => getItem(id)));
    const stories = items.map(toStory).filter(Boolean);

    ok(res, stories, { page, limit, hasMore: end < ids.length });
  })
);

// GET /api/stories/:id
app.get(
  "/api/stories/:id",
  route(async (req, res) => {
    const id = intParam(req.params.id, NaN);
    if (Number.isNaN(id)) throw new HttpError(400, "invalid story id");

    const item = await getItem(id);
    if (!item) throw new HttpError(404, `story ${id} not found`);
    ok(res, toStory(item));
  })
);

// GET /api/stories/:id/comments  -> fully nested comment forest
app.get(
  "/api/stories/:id/comments",
  route(async (req, res) => {
    const id = intParam(req.params.id, NaN);
    if (Number.isNaN(id)) throw new HttpError(400, "invalid story id");

    const forest = await getComments(id);
    if (forest === null) throw new HttpError(404, `story ${id} not found`);
    ok(res, forest);
  })
);

// GET /api/users/:id  (phase 2, but implemented)
app.get(
  "/api/users/:id",
  route(async (req, res) => {
    const user = await getUser(req.params.id);
    if (!user) throw new HttpError(404, `user "${req.params.id}" not found`);
    ok(res, user);
  })
);

// Health check.
app.get("/api/health", (_req, res) => ok(res, { status: "ok" }));

// 404 for anything else.
app.use((_req, res) => fail(res, 404, "not found"));

app.listen(PORT, () => {
  console.log(`HN reader backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
