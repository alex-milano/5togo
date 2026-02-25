import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

// Pick a message deterministically by day-of-year so it stays constant all day
function pickDailyMessage(messages) {
  if (!messages.length) return null
  const start     = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000)
  return messages[dayOfYear % messages.length]
}

export default function DailyMotivation() {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const q    = query(collection(db, 'motivationalMessages'), where('isActive', '==', true))
        const snap = await getDocs(q)
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setMessage(pickDailyMessage(msgs))
      } catch (e) {
        console.warn('DailyMotivation: could not load messages', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !message) return null

  return (
    <div className="daily-motivation">
      <span className="dm-icon">💡</span>
      <div className="dm-body">
        <p className="dm-text">{message.text}</p>
        {message.author && (
          <span className="dm-author">— {message.author}</span>
        )}
      </div>
    </div>
  )
}
