import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { ArrowLeft, Search } from 'lucide-react'
import UserCard from '../components/UserCard'

export default function UserSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!q.trim() || q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const lower = q.trim().toLowerCase()
      try {
        // Prefix query: handles starting with `lower`
        const snap = await getDocs(
          query(
            collection(db, 'users'),
            where('handle', '>=', lower),
            where('handle', '<=', lower + '\uf8ff'),
            orderBy('handle'),
            limit(20),
          )
        )
        setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error('Search error:', e)
        setResults([])
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, 400)
  }, [q])

  return (
    <div className="search-page">
      <div className="search-back">
        <Link to="/app" className="nav-btn">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="search-header">
        <h1 className="history-title">Search Users</h1>
      </div>

      <div className="search-input-wrap">
        <Search size={15} className="search-icon" />
        <input
          className="search-input"
          placeholder="Search by handle…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
          autoComplete="off"
        />
      </div>

      {loading && (
        <div className="cal-loading">
          <div className="spinner" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="search-empty">No users found for "{q}"</div>
      )}

      <div className="search-results">
        {results.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
