import { useState } from 'react'
import { timeAgo } from '../format.js'

// Recursive comment node. The backend delivers the tree fully nested via
// `kids`, so we just render it. Dead/deleted nodes are collapsed to a stub
// but still show their children (a deleted parent can have live replies).
export default function Comment({ comment }) {
  const [collapsed, setCollapsed] = useState(false)
  const kids = comment.kids || []
  const gone = comment.deleted || comment.dead

  return (
    <li className="comment">
      <div className="comment-head">
        <button className="toggle" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? '[+]' : '[–]'}
        </button>{' '}
        {gone ? (
          <span className="muted">[{comment.deleted ? 'deleted' : 'dead'}]</span>
        ) : (
          <span className="muted">
            {comment.by} · {timeAgo(comment.time)}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          {!gone && (
            <div
              className="comment-text"
              dangerouslySetInnerHTML={{ __html: comment.text || '' }}
            />
          )}
          {kids.length > 0 && (
            <ul className="comment-kids">
              {kids.map((k) => (
                <Comment key={k.id} comment={k} />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  )
}
