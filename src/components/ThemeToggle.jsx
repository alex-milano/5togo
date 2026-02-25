import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { lightMode, toggleLightMode } = useTheme()

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleLightMode}
      title={lightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label={lightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      <span className="theme-toggle-icon">{lightMode ? '🌙' : '☀️'}</span>
      <span className="theme-toggle-label">{lightMode ? 'Dark' : 'Light'}</span>
    </button>
  )
}
