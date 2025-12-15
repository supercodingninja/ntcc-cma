import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { Music, Mail, Lock, User as UserIcon, AlertCircle, Settings } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { colorblindMode, setColorblindMode, language, setLanguage, t, getColorScheme } = useAccessibility()
  const colors = getColorScheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message || 'Failed to create account')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-5 rounded-2xl border-2 border-white/30 shadow-2xl shimmer-border">
                <Music className="h-14 w-14 text-white heartbeat" />
              </div>
            </div>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight whitespace-nowrap">The NTCC Music App</h1>
          <p className="text-sm xs:text-base sm:text-lg font-light text-blue-200">Church Music Management</p>
        </div>

        <div className="bg-silver/35 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
              onMouseEnter={() => setShowAccessibilityMenu(true)}
              className="group relative bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-3 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-slow border-2 border-white/50"
              aria-label="Accessibility Options"
            >
              <Settings className="h-5 w-5 text-white animate-spin-slow" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
            </button>
            {showAccessibilityMenu && (
              <div
                onMouseLeave={() => setShowAccessibilityMenu(false)}
                className="absolute right-0 mt-2 w-72 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border-2 border-gradient-to-r from-blue-300 via-purple-300 to-pink-300 p-5 space-y-5 animate-fade-in"
              >
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-500" />
                    Accessibility Settings
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👁️ {t('colorblindMode')}
                    </label>
                    <select
                      value={colorblindMode}
                      onChange={(e) => setColorblindMode(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/90 transition-all hover:border-purple-300"
                    >
                      <option value="normal">{t('normal')}</option>
                      <option value="deuteranopia">{t('deuteranopia')}</option>
                      <option value="protanopia">{t('protanopia')}</option>
                      <option value="tritanopia">{t('tritanopia')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🌍 {t('language')}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 transition-all hover:border-blue-300"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-8">Join us and start managing your music</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-12 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
