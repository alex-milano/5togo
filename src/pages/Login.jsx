import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { validateHandleFormat, checkHandleAvailable } from '../utils/handleValidation'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle]         = useState('')
  const [handleMsg, setHandleMsg]   = useState('')
  const [handleOk, setHandleOk]     = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  // Debounced handle check — 500ms, only when isRegister
  useEffect(() => {
    if (!isRegister) return
    setHandleOk(false)
    const fmt = validateHandleFormat(handle)
    if (handle.length === 0) {
      setHandleMsg('')
      return
    }
    if (fmt) {
      setHandleMsg(fmt)
      return
    }
    setHandleMsg('Checking…')
    const t = setTimeout(async () => {
      const available = await checkHandleAvailable(db, handle)
      if (available) {
        setHandleMsg('✓ Available')
        setHandleOk(true)
      } else {
        setHandleMsg('Handle already taken.')
        setHandleOk(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [handle, isRegister])

  const title = isRegister ? 'Create your account' : 'Sign in to your account'
  const btnLabel = isRegister ? 'Create Account' : 'Sign In'

  function friendlyError(code) {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isRegister && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (isRegister && !displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (isRegister && !handleOk) {
      setError('Please choose a valid, available handle.')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        await register(email.trim(), password, handle.trim(), displayName.trim())
      } else {
        await login(email.trim(), password)
      }
      navigate('/app', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setIsRegister(v => !v)
    setError('')
    setPassword('')
    setConfirm('')
    setHandle('')
    setDisplayName('')
    setHandleMsg('')
    setHandleOk(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">5toGo</div>
        </div>
        <p className="auth-tagline">5 YARDS TO TOUCHDOWN</p>

        {/* Form */}
        <p className="auth-title">{title}</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder={isRegister ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {isRegister && (
            <>
              <div className="auth-field">
                <label className="auth-label">Display Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your full name or nickname"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={40}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Handle</label>
                <div className="handle-input-wrap">
                  <span className="handle-at">@</span>
                  <input
                    className={`auth-input handle-input ${handleOk ? 'handle-ok' : ''}`}
                    type="text"
                    placeholder="your_handle"
                    value={handle}
                    onChange={e => setHandle(e.target.value.toLowerCase())}
                    maxLength={20}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                {handleMsg && (
                  <span className={`handle-hint ${handleOk ? 'handle-hint-ok' : 'handle-hint-err'}`}>
                    {handleMsg}
                  </span>
                )}
              </div>
            </>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (isRegister ? 'Creating account…' : 'Signing in…') : btnLabel}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={toggleMode}>
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  )
}
