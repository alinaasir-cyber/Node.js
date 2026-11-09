import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AuthPage } from './AuthPage.jsx'
import { FinanceApp } from './FinanceApp.jsx'
import './App.css'

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem('finance-auth')) ?? null
  } catch {
    return null
  }
}

function App() {
  const [auth, setAuth] = useState(readStoredAuth)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function signIn(data) {
    const nextAuth = { token: data.token, user: data.user }
    queryClient.clear()
    localStorage.setItem('finance-auth', JSON.stringify(nextAuth))
    setAuth(nextAuth)
    navigate('/')
  }

  function signOut() {
    queryClient.clear()
    localStorage.removeItem('finance-auth')
    setAuth(null)
    navigate('/login')
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={auth?.token ? <Navigate to="/" replace /> : <AuthPage onAuthenticated={signIn} />}
      />
      <Route
        path="/*"
        element={auth?.token
          ? <FinanceApp auth={auth} onSignOut={signOut} />
          : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
