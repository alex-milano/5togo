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
  onSnapshot,
  updateDoc,
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
  const [userProfile, setUserProfile]   = useState(null)
  const [authLoading, setAuthLoading]   = useState(true)

  // ── Register ─────────────────────────────────────────────────────────
  async function register(email, password, handle, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user'
    const h = handle.trim().toLowerCase()

    // Create user document
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid:         cred.user.uid,
      email:       email.toLowerCase(),
      role,
      handle:      h,
      displayName: displayName.trim(),
      bio:         '',
      createdAt:   serverTimestamp(),
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

  // ── Update user profile ────────────────────────────────────────────────
  async function updateUserProfile(data) {
    if (!currentUser) return
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    // onSnapshot will auto-update userProfile state
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
        setUserProfile(null)
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  // ── Live profile listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), snap => {
      if (snap.exists()) setUserProfile({ id: snap.id, ...snap.data() })
      else setUserProfile(null)
    })
    return unsub
  }, [currentUser])

  // Computed: true when user is logged in but has no handle (migration case)
  const needsHandle = !!currentUser && !!userProfile && !userProfile.handle

  const value = {
    currentUser,
    userRole,
    userProfile,
    authLoading,
    needsHandle,
    register,
    login,
    logout,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
