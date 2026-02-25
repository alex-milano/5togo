import { collection, query, where, getDocs } from 'firebase/firestore'

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/

export function validateHandleFormat(handle) {
  if (!handle || handle.trim().length === 0) return 'Handle is required.'
  const h = handle.trim().toLowerCase()
  if (h.length < 3) return 'Handle must be at least 3 characters.'
  if (h.length > 20) return 'Handle must be 20 characters or less.'
  if (!HANDLE_REGEX.test(h)) return 'Only lowercase letters, numbers, and underscores allowed.'
  return null // valid
}

export async function checkHandleAvailable(db, handle, excludeUid = null) {
  const h = handle.trim().toLowerCase()
  try {
    const q = query(collection(db, 'users'), where('handle', '==', h))
    const snap = await getDocs(q)
    if (snap.empty) return true
    if (excludeUid && snap.docs.length === 1 && snap.docs[0].id === excludeUid) return true
    return false
  } catch (e) {
    console.warn('checkHandleAvailable error:', e)
    return false
  }
}
