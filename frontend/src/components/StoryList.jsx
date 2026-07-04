import { useEffect, useState } from 'react'
import { getStories, FEEDS } from '../api.js'
import StoryItem from './StoryItem.jsx'

const LIMIT = 30

export default function StoryList({ feed, onFeedChange, onOpen }) {
  const [stories, setStories] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load (or reload) a feed. page=1 replaces, page>1 appends.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getStories({ feed, page, limit: LIMIT })
      .then((res) => {
        if (cancelled) return
        setStories((prev) => (page === 1 ? res.stories : [...prev, ...res.stories]))
        setHasMore(res.hasMore)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [feed, page])

  function switchFeed(next) {
    if (next === feed) return
    setStories([])
    setPage(1)
    onFeedChange(next)
  }

  return (
    <div>
      <nav className="feeds">
        {FEEDS.map((f) => (
          <button
            key={f}
            className={f === feed ? 'feed active' : 'feed'}
            onClick={() => switchFeed(f)}
          >
            {f}
          </button>
        ))}
      </nav>

      {error && <p className="error">Couldn’t load stories: {error}</p>}

      <ol className="stories" start={1}>
        {stories.map((s, i) => (
          <StoryItem key={s.id} story={s} rank={i + 1} onOpen={onOpen} />
        ))}
      </ol>

      {loading && <p className="muted">Loading…</p>}

      {hasMore && !loading && (
        <button className="more" onClick={() => setPage((p) => p + 1)}>
          More
        </button>
      )}
    </div>
  )
}
