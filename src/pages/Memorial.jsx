// ============================================
// This Area Of Code Is: Memorial Page Component
// ============================================
// Explanation: This page is a tribute memorial for John Orkin Smith, a beloved member
// of the NTCC CMA church music ministry who passed away. It displays a beautiful
// animated musical staff, his photo area, biographical information, and a scripture verse.
// The page uses elegant design with gold/yellow accents to honor his memory.
//
// In Other Words: This is like a digital memorial card or tribute page. When someone visits,
// they see a beautiful page remembering John Orkin Smith with music notes, his dates, and kind words.
// ============================================

import React from 'react'
import Layout from '../components/Layout'
import { useAccessibility } from '../contexts/AccessibilityContext'

export default function Memorial() {
  // ============================================
  // This Area Of Code Is: Accessibility Hook
  // ============================================
  // Explanation: Gets the translation function so text can be displayed in different languages.
  // The 't' function translates text keys into the user's selected language.
  //
  // In Other Words: This helps the page speak different languages depending on what the user chose.
  // ============================================
  const { t } = useAccessibility()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative h-96">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="staffGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#d4af37', stopOpacity: 0.6 }} />
                  <stop offset="50%" style={{ stopColor: '#ffd700', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
              <path d="M0,100 Q300,80 600,100 T1200,100" fill="none" stroke="url(#staffGradient)" strokeWidth="3" />
              <path d="M0,130 Q300,110 600,130 T1200,130" fill="none" stroke="url(#staffGradient)" strokeWidth="3" />
              <path d="M0,160 Q300,140 600,160 T1200,160" fill="none" stroke="url(#staffGradient)" strokeWidth="3" />
              <path d="M0,190 Q300,170 600,190 T1200,190" fill="none" stroke="url(#staffGradient)" strokeWidth="3" />
              <path d="M0,220 Q300,200 600,220 T1200,220" fill="none" stroke="url(#staffGradient)" strokeWidth="3" />
            </svg>
            {/* ============================================
            This Area Of Code Is: Photo Background Area
            ============================================
            Explanation: This creates a subtle gradient background where a memorial photo would go.
            The gradient provides a soft, elegant backdrop that complements the golden musical staff.

            In Other Words: This is like a picture frame with a nice background color that looks good.
            ============================================ */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black"></div>
          </div>

          <div className="relative px-8 pb-12 pt-8 text-white">
            <div className="text-center space-y-6">
              <p className="text-6xl font-serif italic text-yellow-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {t('inMemoriam')}
              </p>

              <h1 className="text-5xl font-bold tracking-wide uppercase mb-4" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em' }}>
                John Orkin Smith
              </h1>

              <div className="border-t border-b border-yellow-400/50 py-4 mb-6">
                <p className="text-2xl font-light tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  December 17, 1969 ~ November 8, 2022
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4 text-lg leading-relaxed">
                <p className="text-gray-300 italic" style={{ fontFamily: 'Georgia, serif' }}>
                  Rest in peace our brother beloved...
                </p>
                <p className="text-yellow-200 font-serif text-xl">
                  "Precious in the sight of the Lord is the death of his saints."
                </p>
                <p className="text-gray-400 text-base">
                  Psalm 116:15
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-700">
                <div className="flex justify-center items-center space-x-4 mb-6">
                  <div className="w-16 h-0.5 bg-yellow-400"></div>
                  <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  <div className="w-16 h-0.5 bg-yellow-400"></div>
                </div>

                <p className="text-gray-400 text-sm">
                  Forever in our hearts, always in our memories
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  NTCC CMA Church Music Ministry
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">A Legacy of Music and Faith</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              John Orkin Smith was a beloved member of the NTCC CMA church community,
              whose passion for music touched the hearts of all who knew him. His dedication
              to the choir and his gift for worship enriched our services and brought glory
              to God through song.
            </p>
            <p className="mb-4">
              As a faithful servant and talented musician, John's voice was an integral part
              of our worship team. He believed deeply in the power of music to bring people
              closer to God and to build community among believers.
            </p>
            <p>
              Though he is no longer with us in body, his spirit lives on through the music
              we continue to make together, and in the memories we cherish. May his legacy
              inspire us to worship with the same joy, dedication, and love that he brought
              to every rehearsal and every service.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
