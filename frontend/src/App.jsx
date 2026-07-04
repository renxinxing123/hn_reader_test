import { useState } from 'react'
import StoryList from './components/StoryList.jsx'
import StoryDetail from './components/StoryDetail.jsx'

export default function App() {
  const [feed, setFeed] = useState('top')
  const [openId, setOpenId] = useState(null)

  return (
    <div className="app">
      <header className="topbar">
        <h1 onClick={() => setOpenId(null)}>HN Reader</h1>
      </header>

      <main>
        {openId == null ? (
          <StoryList feed={feed} onFeedChange={setFeed} onOpen={setOpenId} />
        ) : (
          <StoryDetail id={openId} onBack={() => setOpenId(null)} />
        )}
      </main>
    </div>
  )
}
