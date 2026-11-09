import { useState } from 'react'
import { apiRequest, DEMO_TOKEN } from './api.js'
import { Icon } from './Icons.jsx'

export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const result = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(form)
      })
      onAuthenticated(result.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  function enterDemo() {
    onAuthenticated({
      token: DEMO_TOKEN,
      user: {
        id: 'ledgerly-demo',
        name: 'Demo Account',
        email: 'demo@ledgerly.local'
      }
    })
  }

  return (
    <main className="auth-page auth-simple">
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-login-brand">
            <span className="brand-mark"><Icon name="chart" size={24} /></span>
            <strong>Ledgerly</strong>
            <span>Personal Finance Tracker</span>
          </div>
          <div className="auth-heading">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Your finances are right where you left them.' : 'Start building a healthier relationship with money.'}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  placeholder="Your name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
            )}
            <label>
              Email address
              <input
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                placeholder="At least 8 characters"
                required
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={submitting} type="submit">
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? 'New to Ledgerly?' : 'Already have an account?'}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
          <div className="demo-divider"><span>OR EXPLORE FIRST</span></div>
          <button className="demo-account-button" onClick={enterDemo} type="button">
            <span className="demo-button-icon"><Icon name="eye" size={17} /></span>
            <span><strong>Continue with demo account</strong><small>Explore with sample data — no sign-up needed</small></span>
            <Icon className="demo-button-arrow" name="chevron" size={16} />
          </button>
          <p className="demo-privacy-note">Demo changes are saved only in this browser.</p>
          <div className="auth-security"><Icon name="lock" size={14} /> Your financial data is private and secure</div>
        </div>
      </section>
    </main>
  )
}
