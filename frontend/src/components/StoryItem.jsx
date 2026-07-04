import { timeAgo, hostFrom } from '../format.js'

export default function StoryItem({ story, rank, onOpen }) {
  const host = hostFrom(story)
  const isLink = Boolean(story.url)

  return (
    <li className="story">
      <span className="rank">{rank}.</span>
      <div className="story-body">
        <div className="story-title">
          {isLink ? (
            <a href={story.url} target="_blank" rel="noopener noreferrer">
              {story.title}
            </a>
          ) : (
            <button className="linklike" onClick={() => onOpen(story.id)}>
              {story.title}
            </button>
          )}
          {host && <span className="domain"> ({host})</span>}
        </div>
        <div className="story-meta">
          {story.score} points by {story.by} · {timeAgo(story.time)} ·{' '}
          <button className="linklike" onClick={() => onOpen(story.id)}>
            {story.descendants ?? 0} comments
          </button>
        </div>
      </div>
    </li>
  )
}
