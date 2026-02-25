import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from './AuthContext'
import { getTheme } from '../themes/themeConfig'

const ThemeContext = createContext({ themeName: 'normal', themeData: getTheme('normal') })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const { currentUser } = useAuth()
  const [themeName, setThemeName] = useState('normal')

  // Real-time theme sync from Firestore
  useEffect(() => {
    if (!currentUser) {
      setThemeName('normal')
      return
    }
    const unsub = onSnapshot(doc(db, 'userSettings', currentUser.uid), snap => {
      if (snap.exists()) setThemeName(snap.data().theme || 'normal')
    })
    return unsub
  }, [currentUser])

  // Apply data-theme attribute to <html> so CSS vars take effect
  useEffect(() => {
    if (themeName === 'normal') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', themeName)
    }
  }, [themeName])

  return (
    <ThemeContext.Provider value={{ themeName, themeData: getTheme(themeName) }}>
      {children}
    </ThemeContext.Provider>
  )
}
