import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import { api } from './utils/api'

function App() {
  const { token, user, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me').then(res => {
        setUser(res.data, token)
      }).catch(() => {
        logout()
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={token ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
