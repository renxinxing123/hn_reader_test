import { useEffect, useState } from 'react'
import { getStory, getComments } from '../api.js'
import { timeAgo, hostFrom } from '../format.js'
import Comment from './Comment.jsx'

export default function StoryDetail({ id, onBack }) {
  const [story, setStory] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getStory(id), getComments(id)])
      .then(([s, c]) => {
        if (cancelled) return
        setStory(s)
        setComments(c || [])
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  const host = story && hostFrom(story)

  return (
    <div className="detail">
      <button className="back" onClick={onBack}>
        ← back
      </button>

      {error && <p className="error">Couldn’t load story: {error}</p>}
      {loading && <p className="muted">Loading…</p>}

      {story && (
        <>
          <h2 className="detail-title">
            {story.url ? (
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                {story.title}
              </a>
            ) : (
              story.title
            )}
            {host && <span className="domain"> ({host})</span>}
          </h2>
          <div className="story-meta">
            {story.score} points by {story.by} · {timeAgo(story.time)} ·{' '}
            {story.descendants ?? 0} comments
          </div>
          {story.text && (
            <div
              className="story-text"
              dangerouslySetInnerHTML={{ __html: story.text }}
            />
          )}

          <ul className="comment-tree">
            {comments.map((c) => (
              <Comment key={c.id} comment={c} />
            ))}
          </ul>
          {!loading && comments.length === 0 && (
            <p className="muted">No comments yet.</p>
          )}
        </>
      )}
    </div>
  )
}
