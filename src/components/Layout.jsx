// This Area Of Code Is: Main Layout Component
// Explanation: Provides consistent navigation and structure for all authenticated pages
// In Other Words: This is the frame that goes around every page with the menu and header

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { Music, Home, History, FileText, Users as UsersIcon, User, LogOut, Menu, X, Heart, Eye, Volume2, UserCheck, Sparkles, Globe, Accessibility as AccessibilityIcon } from 'lucide-react'
import AccessibilityMenu from './AccessibilityMenu'
import JPPromptWindow from './AI/JPPromptWindow'
import TanyaDesignTool from './AI/TanyaDesignTool'
import VickieMusicAssistant from './AI/VickieMusicAssistant'

// This Area Of Code Is: Layout Component Definition
// Explanation: Creates the page wrapper with navigation bar and content area
// In Other Words: This builds the menu bar at the top and makes room for the page content
export default function Layout({ children }) {
  const { user, profile, signOut, isAdmin, isEditor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [activeAITool, setActiveAITool] = useState(null)
  const { t, getColorScheme, setLanguage } = useAccessibility()

  const colors = getColorScheme()

  const notePositions = {
    'E5': { note: '♪', staffPosition: 0 },
    'D5': { note: '♫', staffPosition: 1 },
    'C5': { note: '♪', staffPosition: 2 },
    'B4': { note: '♫', staffPosition: 3 },
    'A4': { note: '♪', staffPosition: 4 },
    'G4': { note: '♫', staffPosition: 5 },
    'F4': { note: '♪', staffPosition: 6 },
    'E4': { note: '♫', staffPosition: 7 },
    'D4': { note: '♪', staffPosition: 8 }
  }

  useEffect(() => {
    const notes = []
    const createFloatingNote = () => {
      const noteKeys = Object.keys(notePositions)
      const randomNoteKey = noteKeys[Math.floor(Math.random() * noteKeys.length)]
      const { note: noteSymbol, staffPosition } = notePositions[randomNoteKey]

      const note = document.createElement('div')
      note.className = 'floating-note-on-staff'
      note.textContent = noteSymbol
      note.style.left = `${Math.random() * 95}%`
      note.style.top = `${10 + (staffPosition * 5)}%`
      note.style.animationDelay = `${Math.random() * 3}s`
      note.style.animationDuration = `${6 + Math.random() * 4}s`
      document.body.appendChild(note)
      notes.push(note)

      setTimeout(() => {
        note.remove()
        const index = notes.indexOf(note)
        if (index > -1) notes.splice(index, 1)
      }, 10000)
    }

    const interval = setInterval(createFloatingNote, 800)
    for (let i = 0; i < 5; i++) {
      setTimeout(createFloatingNote, i * 400)
    }

    return () => {
      clearInterval(interval)
      notes.forEach(note => note.remove())
    }
  }, [])

  // This Area Of Code Is: Logout Handler
  // Explanation: Handles user logout and redirects to login page
  // In Other Words: This is what happens when you click the logout button
  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // This Area Of Code Is: Active Link Check
  // Explanation: Determines if a navigation link matches the current page
  // In Other Words: This highlights which page you're currently on in the menu
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const [backgroundIndex, setBackgroundIndex] = React.useState(0)
  const choirImages = [
    '/src/assets/IMG_7086.jpeg',
    '/src/assets/IMG_7087.jpeg',
    '/src/assets/IMG_7088.jpeg',
    '/src/assets/IMG_7089.jpeg',
    '/src/assets/IMG_7090.jpeg',
    '/src/assets/IMG_7091.jpeg',
    '/src/assets/IMG_7092.jpeg'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % choirImages.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden musical-staff-background">
      <div className="fixed inset-0 -z-10">
        <img
          src={choirImages[backgroundIndex]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-1000"
          style={{ filter: 'blur(2px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-blue-900/60 to-gray-900/70" />
      </div>
      <nav className="bg-white/80 backdrop-blur-lg text-gray-800 shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* This Area Of Code Is: Logo and Brand */}
            {/* Explanation: App name/logo that links to dashboard */}
            {/* In Other Words: This is the app name you can click to go home */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-xl group-hover:shadow-lg transition-shadow">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent whitespace-nowrap leading-tight">The NTCC Music App</span>
                  <span className="text-xs text-gray-500 font-medium">Church Music Management</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <div className="relative mr-2">
                <button
                  onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  aria-label="Accessibility Options"
                  aria-expanded={showAccessibilityMenu}
                >
                  <Eye className="h-5 w-5" />
                </button>
                <AccessibilityMenu
                  isOpen={showAccessibilityMenu}
                  onClose={() => setShowAccessibilityMenu(false)}
                />
              </div>
              {!isActive('/dashboard') && (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <Home className="h-4 w-4" />
                  <span>{t('dashboard')}</span>
                </Link>
              )}

              {!isActive('/songs') && (
                <Link
                  to="/songs"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <Music className="h-4 w-4" />
                  <span>{t('songs')}</span>
                </Link>
              )}

              {!isActive('/practice-history') && (
                <Link
                  to="/practice-history"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <History className="h-4 w-4" />
                  <span>{t('practiceHistory')}</span>
                </Link>
              )}

              {!isActive('/practice') && (
                <Link
                  to="/practice"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Practice</span>
                </Link>
              )}

              {!isActive('/memorial') && (
                <Link
                  to="/memorial"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <Heart className="h-4 w-4" />
                  <span>{t('memorial')}</span>
                </Link>
              )}

              {!isActive('/leadership') && (
                <Link
                  to="/leadership"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Behind the Scenes</span>
                </Link>
              )}

              {isAdmin() && (
                <>
                  {!isActive('/reports') && (
                    <Link
                      to="/reports"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{t('reports')}</span>
                    </Link>
                  )}

                  {!isActive('/users') && (
                    <Link
                      to="/users"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100"
                    >
                      <UsersIcon className="h-4 w-4" />
                      <span>{t('users')}</span>
                    </Link>
                  )}
                </>
              )}

              {/* This Area Of Code Is: User Profile Menu */}
              {/* Explanation: Shows user name, role, and logout option */}
              {/* In Other Words: This shows your name and has the logout button */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{profile?.full_name || user?.email}</div>
                    <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:text-red-600 transition-colors text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            {/* This Area Of Code Is: Mobile Menu Button */}
            {/* Explanation: Hamburger menu button visible on mobile devices */}
            {/* In Other Words: This is the menu button with three lines on phones */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* This Area Of Code Is: Mobile Navigation Menu */}
        {/* Explanation: Dropdown menu that appears on mobile when hamburger is clicked */}
        {/* In Other Words: This is the menu that slides down on phones */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!isActive('/dashboard') && (
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
              )}

              {!isActive('/songs') && (
                <Link
                  to="/songs"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('songs')}
                </Link>
              )}

              {!isActive('/practice-history') && (
                <Link
                  to="/practice-history"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('practiceHistory')}
                </Link>
              )}

              {!isActive('/practice') && (
                <Link
                  to="/practice"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Practice
                </Link>
              )}

              {!isActive('/memorial') && (
                <Link
                  to="/memorial"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('memorial')}
                </Link>
              )}

              {!isActive('/leadership') && (
                <Link
                  to="/leadership"
                  className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Behind the Scenes
                </Link>
              )}

              {isAdmin() && (
                <>
                  {!isActive('/reports') && (
                    <Link
                      to="/reports"
                      className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('reports')}
                    </Link>
                  )}

                  {!isActive('/users') && (
                    <Link
                      to="/users"
                      className="block px-4 py-3 rounded-lg text-base font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('users')}
                    </Link>
                  )}
                </>
              )}

              <Link
                to="/profile"
                className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  isActive('/profile') ? `${colors.primaryBg} text-white` : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('profile')}
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full text-left block px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* This Area Of Code Is: Main Content Area */}
      {/* Explanation: Container for the page-specific content */}
      {/* In Other Words: This is where each page's content appears below the menu */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" tabIndex="-1">
        {children}
      </main>

      {/* Floating Action Buttons */}
      <div className="floating-fab-container">
        <button
          onClick={() => setShowAIMenu(!showAIMenu)}
          className="fab-button fab-ai"
          aria-label="AI Assistant Tools"
        >
          <span className="fab-tooltip">AI Assistants</span>
          <Sparkles />
        </button>
        <button
          onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
          className="fab-button fab-accessibility"
          aria-label="Accessibility Options"
        >
          <span className="fab-tooltip">Accessibility</span>
          <Eye />
        </button>
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="fab-button fab-language"
          aria-label="Language Selector"
        >
          <span className="fab-tooltip">Language</span>
          <Globe />
        </button>
      </div>

      {/* AI Tools Menu */}
      {showAIMenu && (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => setShowAIMenu(false)}
          />
          <div className="ai-tools-menu">
            <h3 className="font-bold text-lg mb-3 text-gray-900">AI Assistants</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveAITool('jp')
                  setShowAIMenu(false)
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                💬 JP - Chat Assistant
              </button>
              <button
                onClick={() => {
                  setActiveAITool('tanya')
                  setShowAIMenu(false)
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                🎨 Tanya - Design Tool
              </button>
              <button
                onClick={() => {
                  setActiveAITool('vickie')
                  setShowAIMenu(false)
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                🎵 Vickie - Music Assistant
              </button>
            </div>
          </div>
        </>
      )}

      {/* Accessibility Menu */}
      {showAccessibilityMenu && (
        <AccessibilityMenu
          isOpen={showAccessibilityMenu}
          onClose={() => setShowAccessibilityMenu(false)}
        />
      )}

      {/* Language Menu */}
      {showLanguageMenu && (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => setShowLanguageMenu(false)}
          />
          <div className="fixed bottom-28 right-8 z-[1000] bg-white rounded-2xl shadow-2xl p-4 min-w-[200px] animate-slide-up">
            <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              {t('language')}
            </h3>
            <div className="space-y-1">
              {Object.entries({
                en: { nativeName: 'English', flag: '🇺🇸' },
                es: { nativeName: 'Español', flag: '🇪🇸' },
                fr: { nativeName: 'Français', flag: '🇫🇷' },
                de: { nativeName: 'Deutsch', flag: '🇩🇪' },
                zh: { nativeName: '中文', flag: '🇨🇳' },
                ja: { nativeName: '日本語', flag: '🇯🇵' }
              }).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code)
                    setShowLanguageMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all flex items-center gap-3 font-medium"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-gray-800">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI Tool Windows */}
      <JPPromptWindow isOpen={activeAITool === 'jp'} onClose={() => setActiveAITool(null)} />
      <TanyaDesignTool isOpen={activeAITool === 'tanya'} onClose={() => setActiveAITool(null)} />
      <VickieMusicAssistant isOpen={activeAITool === 'vickie'} onClose={() => setActiveAITool(null)} />
    </div>
  )
}
