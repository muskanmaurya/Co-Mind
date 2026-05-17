import { createContext, useContext, useState, useEffect } from 'react'
import { auth as api } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_user')) } catch(e){ return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('cm_token'))

  useEffect(()=>{
    if (user) localStorage.setItem('cm_user', JSON.stringify(user)); else localStorage.removeItem('cm_user')
    if (token) localStorage.setItem('cm_token', token); else localStorage.removeItem('cm_token')
  }, [user, token])

  const login = async ({ email, password }) => {
    const res = await api.login({ email, password })
    setUser(res.user)
    setToken(res.token)
    return res
  }

  const signup = async ({ name, email, password }) => {
    const res = await api.signup({ name, email, password })
    setUser(res.user)
    setToken(res.token)
    return res
  }

  const logout = () => { setUser(null); setToken(null) }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
