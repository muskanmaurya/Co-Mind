import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CircleUserRound, Mail, Lock, User, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const AuthForm = ({ mode='login' }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, signup, token } = useAuth()

  useEffect(() => {
    if (token) navigate('/dashboard')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') await signup({ name, email, password })
      else await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.body?.message || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'signup' ? 'CREATE ACCOUNT' : 'WELCOME BACK'
  const subtitle = mode === 'signup'
    ? 'Start collaborating with your AI-powered workspace'
    : 'Enter your email and password to access your account'

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex w-full max-w-4xl overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-lg"
      >
        <div
  className="relative hidden w-[45%] flex-col overflow-hidden bg-cover bg-center p-10 md:flex"
  style={{
    backgroundImage: 'url(/src/assets/co-mind-illustration.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-white/20" />
  
  <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-sky-200/40 blur-2xl" />
  <div className="absolute bottom-10 right-6 h-48 w-48 rounded-full bg-white/60 blur-3xl" />
  
  <div className="relative z-10 mt-auto space-y-2 pb-2 text-5xl font-black leading-none tracking-wider text-slate-900">
    <p className="bg-linear-to-r from-slate-950 to-slate-800 bg-clip-text text-transparent">SYNC.</p>
    <p className="bg-linear-to-r from-slate-950 to-slate-800 bg-clip-text text-transparent">THINK.</p>
    <p className="bg-linear-to-r from-slate-950 to-slate-800 bg-clip-text text-transparent">GROW.</p>
  </div>
</div>

        <div className="w-full bg-white px-8 py-8 sm:px-12 sm:py-10 md:w-[55%]">
          <div className="mb-8 flex items-center gap-2 text-slate-700">
            <CircleUserRound size={18} strokeWidth={1.75} className="text-sky-600" />
            <span className="text-xs font-semibold tracking-[0.2em]">CO-MIND</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Full Name</span>
                <div className="flex items-center rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-400">
                  <User size={16} strokeWidth={1.75} className="text-slate-400" />
                  <input
                    value={name}
                    onChange={e=>setName(e.target.value)}
                    required
                    className="w-full bg-transparent px-2 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
              <div className="flex items-center rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-400">
                <Mail size={16} strokeWidth={1.75} className="text-slate-400" />
                <input
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full bg-transparent px-2 py-3 text-sm text-slate-700 outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
              <div className="flex items-center rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-400">
                <Lock size={16} strokeWidth={1.75} className="text-slate-400" />
                <input
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-transparent px-2 py-3 text-sm text-slate-700 outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </label>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e=>setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Remember me
              </label>
              <button type="button" className="font-semibold text-slate-600 hover:text-slate-900">Forgot Password</button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </motion.button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogIn size={16} strokeWidth={1.75} className="text-sky-600" />
              Sign in with Google
            </button>
          </form>

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={mode === 'signup' ? '/login' : '/signup'}
              className="font-semibold text-slate-900 hover:text-sky-700"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </motion.section>
    </main>
  )
}

export default AuthForm
