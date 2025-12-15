import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { Music, Mail, Lock, AlertCircle, Eye, EyeOff, Settings } from 'lucide-react'
import img1 from '../assets/IMG_7082.jpeg'
import img2 from '../assets/IMG_0734.jpeg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(0)
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false)
  const { signIn, dbError } = useAuth()
  const navigate = useNavigate()
  const { colorblindMode, setColorblindMode, language, setLanguage, t, getColorScheme } = useAccessibility()

  const displayError = error || (dbError ? 'Unable to connect to database. Please contact support.' : '')

  const choirImages = [
    '/src/assets/IMG_7086.jpeg',
    '/src/assets/IMG_7087.jpeg',
    '/src/assets/IMG_7088.jpeg',
    '/src/assets/IMG_7089.jpeg',
    '/src/assets/IMG_7090.jpeg'
  ]
  const colors = getColorScheme()

  useEffect(() => {
    if (dbError) {
      const clearCorruptedSession = async () => {
        try {
          localStorage.removeItem('supabase.auth.token')
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key)
            }
          })
        } catch (err) {
          console.error('Failed to clear storage:', err)
        }
      }
      clearCorruptedSession()
    }

    const interval = setInterval(() => {
      setBackgroundImage((prev) => (prev + 1) % choirImages.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [dbError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        if (error.message?.includes('schema') || error.message?.includes('relation')) {
          setError('Unable to connect to database. Please contact support.')
        } else if (error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password')
        } else {
          setError(error.message || 'Failed to sign in')
        }
        setLoading(false)
      } else if (data) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${choirImages[backgroundImage]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px)',
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-blue-900/50 to-black/60" />


      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative" id="music-icon-container">
              <div className={`absolute inset-0 bg-gradient-to-r ${colors.primary} rounded-2xl blur-xl opacity-50 animate-pulse`}></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-5 rounded-2xl border-2 border-white/30 shadow-2xl shimmer-border">
                <Music className="h-14 w-14 text-white heartbeat" />
              </div>
            </div>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight whitespace-nowrap">The NTCC Music App</h1>
          <p className="text-sm xs:text-base sm:text-lg font-light text-blue-200">Church Music Management</p>
        </div>

        <div className="bg-silver/35 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 relative">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcomeBack')}</h2>
          <p className="text-gray-500 mb-8">{t('signInToContinue')}</p>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('emailAddress')}
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:${colors.primaryText} transition-colors`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-12 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:${colors.primaryBorder} transition-all duration-200 bg-gray-50 focus:bg-white`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('password')}
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:${colors.primaryText} transition-colors`} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-12 pr-12 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:${colors.primaryBorder} transition-all duration-200 bg-gray-50 focus:bg-white`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${colors.primary} text-white py-4 px-6 rounded-xl hover:bg-gradient-to-r hover:${colors.primaryHover} focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 mt-6`}
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {t('dontHaveAccount')}{' '}
              <Link to="/signup" className={`${colors.primaryText} hover:text-blue-700 font-semibold hover:underline transition-colors`}>
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
