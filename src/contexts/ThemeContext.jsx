import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from './AuthContext'
import { getTheme } from '../themes/themeConfig'
import { getLightVars } from '../themes/lightTheme'

const ThemeContext = createContext({
  themeName: 'normal',
  themeData: getTheme('normal'),
  lightMode: false,
  toggleLightMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const { currentUser } = useAuth()
  const [themeName, setThemeName] = useState('normal')
  const [lightMode, setLightMode] = useState(false)

  // ── Real-time sync from Firestore ────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setThemeName('normal')
      setLightMode(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'userSettings', currentUser.uid), snap => {
      if (snap.exists()) {
        setThemeName(snap.data().theme || 'normal')
        setLightMode(snap.data().lightMode ?? false)
      }
    })
    return unsub
  }, [currentUser])

  // ── Apply data-theme + data-light attributes to <html> ───────────────────
  useEffect(() => {
    const html = document.documentElement

    // Theme
    if (themeName === 'normal') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', themeName)
    }

    // Light mode: inject CSS vars directly
    if (lightMode) {
      html.setAttribute('data-light', 'true')
      const vars = getLightVars(themeName)
      Object.entries(vars).forEach(([key, val]) => {
        html.style.setProperty(key, val)
      })
    } else {
      html.removeAttribute('data-light')
      // Remove any injected light vars
      const vars = getLightVars(themeName)
      Object.keys(vars).forEach(key => {
        html.style.removeProperty(key)
      })
    }
  }, [themeName, lightMode])

  // ── Toggle light/dark and persist ───────────────────────────────────────
  async function toggleLightMode() {
    const next = !lightMode
    setLightMode(next)
    if (currentUser) {
      await setDoc(
        doc(db, 'userSettings', currentUser.uid),
        { lightMode: next, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }
  }

  return (
    <ThemeContext.Provider value={{ themeName, themeData: getTheme(themeName), lightMode, toggleLightMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
