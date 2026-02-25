import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

// ─── Set this to your email BEFORE registering your account ──────────
// The first user who signs up with this exact address gets role: 'admin'.
// Change it back to '' afterwards to lock it down.
const ADMIN_EMAIL = 'alexjmilano@gmail.com' // ← replace this

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null)
  const [userRole, setUserRole]         = useState(null)
  const [authLoading, setAuthLoading]   = useState(true)

  // ── Register ─────────────────────────────────────────────────────────
  async function register(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user'

    // Create user document
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid:       cred.user.uid,
      email:     email.toLowerCase(),
      role,
      createdAt: serverTimestamp(),
    })

    // Create default settings document
    await setDoc(doc(db, 'userSettings', cred.user.uid), {
      userId:    cred.user.uid,
      theme:     'normal',
      streak:    0,
      lastPeakDay: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return cred
  }

  // ── Login ─────────────────────────────────────────────────────────────
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function logout() {
    return signOut(auth)
  }

  // ── Fetch role from Firestore ─────────────────────────────────────────
  async function fetchRole(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) return snap.data().role || 'user'
    } catch (e) {
      console.warn('AuthContext: could not fetch role', e)
    }
    return 'user'
  }

  // ── Auth state listener ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const role = await fetchRole(user.uid)
        setUserRole(role)
      } else {
        setUserRole(null)
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  const value = {
    currentUser,
    userRole,
    authLoading,
    register,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
