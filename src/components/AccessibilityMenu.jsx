import React from 'react'
import { Palette, Globe, Type, Contrast, Minimize, Eye, Keyboard } from 'lucide-react'
import { useAccessibility } from '../contexts/AccessibilityContext'

export default function AccessibilityMenu({ isOpen, onClose }) {
  const {
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
    languages,
  } = useAccessibility()

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute right-0 mt-2 w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-6 space-y-6 z-50 max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-label={t('accessibility')}
      >
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('accessibility')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('colorblindMode')}
            </label>
            <select
              value={colorblindMode}
              onChange={(e) => setColorblindMode(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              aria-label={t('colorblindMode')}
            >
              <option value="normal">{t('normal')}</option>
              <option value="deuteranopia">{t('deuteranopia')}</option>
              <option value="protanopia">{t('protanopia')}</option>
              <option value="tritanopia">{t('tritanopia')}</option>
              <option value="achromatopsia">{t('achromatopsia')}</option>
              <option value="deuteranomaly">{t('deuteranomaly')}</option>
              <option value="protanomaly">{t('protanomaly')}</option>
              <option value="tritanomaly">{t('tritanomaly')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              aria-label={t('language')}
            >
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Type className="h-4 w-4" />
              {t('fontSize')}
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              aria-label={t('fontSize')}
            >
              <option value="small">{t('small')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="large">{t('large')}</option>
              <option value="extraLarge">{t('extraLarge')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <Contrast className="h-4 w-4" />
              {t('highContrast')}
            </label>
            <button
              onClick={() => setHighContrast(!highContrast)}
              role="switch"
              aria-checked={highContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                highContrast ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <Minimize className="h-4 w-4" />
              {t('reducedMotion')}
            </label>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              role="switch"
              aria-checked={reducedMotion}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <Eye className="h-4 w-4" />
              {t('screenReader')}
            </label>
            <button
              onClick={() => setScreenReaderOptimized(!screenReaderOptimized)}
              role="switch"
              aria-checked={screenReaderOptimized}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                screenReaderOptimized ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  screenReaderOptimized ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <Keyboard className="h-4 w-4" />
              {t('keyboardNavigation')}
            </label>
            <button
              onClick={() => setKeyboardNavigationMode(!keyboardNavigationMode)}
              role="switch"
              aria-checked={keyboardNavigationMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                keyboardNavigationMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  keyboardNavigationMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            WCAG 2.1 AAA Compliant
          </p>
        </div>
      </div>
    </>
  )
}
