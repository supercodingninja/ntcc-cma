import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, languages } from '../lib/i18n'

const AccessibilityContext = createContext({})

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

const colorblindStyles = {
  normal: {
    primary: 'from-blue-600 to-blue-700',
    primaryHover: 'from-blue-700 to-blue-800',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-500',
    secondary: 'from-emerald-600 to-emerald-700',
    secondaryBg: 'bg-emerald-600',
    accent: 'from-violet-600 to-violet-700',
    accentBg: 'bg-violet-600',
    gradient: 'from-slate-900 via-blue-900 to-slate-900',
  },
  deuteranopia: {
    primary: 'from-blue-600 to-indigo-700',
    primaryHover: 'from-blue-700 to-indigo-800',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-500',
    secondary: 'from-yellow-600 to-amber-700',
    secondaryBg: 'bg-yellow-600',
    accent: 'from-pink-600 to-rose-700',
    accentBg: 'bg-pink-600',
    gradient: 'from-slate-900 via-indigo-900 to-slate-900',
  },
  protanopia: {
    primary: 'from-blue-600 to-cyan-700',
    primaryHover: 'from-blue-700 to-cyan-800',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-500',
    secondary: 'from-yellow-500 to-amber-600',
    secondaryBg: 'bg-yellow-500',
    accent: 'from-teal-600 to-cyan-700',
    accentBg: 'bg-teal-600',
    gradient: 'from-slate-900 via-cyan-900 to-slate-900',
  },
  tritanopia: {
    primary: 'from-cyan-600 to-teal-700',
    primaryHover: 'from-cyan-700 to-teal-800',
    primaryBg: 'bg-cyan-600',
    primaryText: 'text-cyan-600',
    primaryBorder: 'border-cyan-500',
    secondary: 'from-pink-600 to-rose-700',
    secondaryBg: 'bg-pink-600',
    accent: 'from-red-600 to-pink-700',
    accentBg: 'bg-red-600',
    gradient: 'from-slate-900 via-teal-900 to-slate-900',
  },
  achromatopsia: {
    primary: 'from-gray-700 to-gray-800',
    primaryHover: 'from-gray-800 to-gray-900',
    primaryBg: 'bg-gray-700',
    primaryText: 'text-gray-700',
    primaryBorder: 'border-gray-600',
    secondary: 'from-gray-500 to-gray-600',
    secondaryBg: 'bg-gray-500',
    accent: 'from-gray-600 to-gray-700',
    accentBg: 'bg-gray-600',
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
  },
  deuteranomaly: {
    primary: 'from-blue-500 to-blue-600',
    primaryHover: 'from-blue-600 to-blue-700',
    primaryBg: 'bg-blue-500',
    primaryText: 'text-blue-500',
    primaryBorder: 'border-blue-400',
    secondary: 'from-orange-500 to-orange-600',
    secondaryBg: 'bg-orange-500',
    accent: 'from-purple-500 to-purple-600',
    accentBg: 'bg-purple-500',
    gradient: 'from-slate-900 via-blue-800 to-slate-900',
  },
  protanomaly: {
    primary: 'from-blue-500 to-cyan-600',
    primaryHover: 'from-blue-600 to-cyan-700',
    primaryBg: 'bg-blue-500',
    primaryText: 'text-blue-500',
    primaryBorder: 'border-blue-400',
    secondary: 'from-amber-500 to-amber-600',
    secondaryBg: 'bg-amber-500',
    accent: 'from-teal-500 to-teal-600',
    accentBg: 'bg-teal-500',
    gradient: 'from-slate-900 via-cyan-800 to-slate-900',
  },
  tritanomaly: {
    primary: 'from-teal-500 to-teal-600',
    primaryHover: 'from-teal-600 to-teal-700',
    primaryBg: 'bg-teal-500',
    primaryText: 'text-teal-500',
    primaryBorder: 'border-teal-400',
    secondary: 'from-rose-500 to-rose-600',
    secondaryBg: 'bg-rose-500',
    accent: 'from-red-500 to-red-600',
    accentBg: 'bg-red-500',
    gradient: 'from-slate-900 via-teal-800 to-slate-900',
  },
}

export function AccessibilityProvider({ children }) {
  const [colorblindMode, setColorblindMode] = useState(() => {
    return localStorage.getItem('colorblindMode') || 'normal'
  })

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium'
  })

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true'
  })

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('reducedMotion') === 'true'
  })

  const [screenReaderOptimized, setScreenReaderOptimized] = useState(() => {
    return localStorage.getItem('screenReaderOptimized') === 'true'
  })

  const [keyboardNavigationMode, setKeyboardNavigationMode] = useState(() => {
    return localStorage.getItem('keyboardNavigationMode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('colorblindMode', colorblindMode)
  }, [colorblindMode])

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
    document.documentElement.dir = languages[language]?.dir || 'ltr'
  }, [language])

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize)
    const sizes = { small: '14px', medium: '16px', large: '18px', extraLarge: '20px' }
    document.documentElement.style.fontSize = sizes[fontSize] || sizes.medium
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast)
    if (highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }, [highContrast])

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion)
    if (reducedMotion) {
      document.body.classList.add('reduce-motion')
    } else {
      document.body.classList.remove('reduce-motion')
    }
  }, [reducedMotion])

  useEffect(() => {
    localStorage.setItem('screenReaderOptimized', screenReaderOptimized)
    if (screenReaderOptimized) {
      document.body.classList.add('screen-reader-optimized')
    } else {
      document.body.classList.remove('screen-reader-optimized')
    }
  }, [screenReaderOptimized])

  useEffect(() => {
    localStorage.setItem('keyboardNavigationMode', keyboardNavigationMode)
    if (keyboardNavigationMode) {
      document.body.classList.add('keyboard-navigation')
    } else {
      document.body.classList.remove('keyboard-navigation')
    }
  }, [keyboardNavigationMode])

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  const getColorScheme = () => {
    return colorblindStyles[colorblindMode] || colorblindStyles.normal
  }

  const value = {
    colorblindMode,
    setColorblindMode,
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    screenReaderOptimized,
    setScreenReaderOptimized,
    keyboardNavigationMode,
    setKeyboardNavigationMode,
    t,
    getColorScheme,
    languages,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
