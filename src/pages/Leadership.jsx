import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useAccessibility } from '../contexts/AccessibilityContext'
import kekelImg from '../assets/IMG_7181 copy.jpeg'
import frederickThomasImg from '../assets/IMG_2750.jpeg'

export default function Leadership() {
  const { t, getColorScheme } = useAccessibility()
  const [activeTab, setActiveTab] = useState(0)
  const colors = getColorScheme()

  const leadershipTeam = [
    {
      name: 'Pastor and Sr. Music Director Michael Kekel',
      image: kekelImg,
      role: 'Senior Pastor & Music Director',
      bio: 'Leading the congregation with wisdom and musical excellence for over three decades.',
    },
    {
      name: 'Sister Tanya Kekel',
      image: null,
      role: 'Ministry Leader',
      bio: 'Dedicated servant leader supporting the ministry with grace and compassion.',
    },
    {
      name: 'Associate Pastor and Music Director Rev. Jeffrey P. Malone',
      image: null,
      role: 'Associate Pastor & Music Director',
      bio: 'Bringing passionate worship leadership and pastoral care to the congregation.',
    },
    {
      name: 'Sister Vickie Malone',
      image: null,
      role: 'Ministry Support',
      bio: 'Serving with devotion and supporting the musical ministry with excellence.',
    },
    {
      name: 'Associate Pastor and Media and Sound Equipment Rev. George Keys',
      image: null,
      role: 'Media & Sound Director',
      bio: 'Ensuring excellence in technical ministry and multimedia presentations.',
    },
    {
      name: 'Media Equipment Rev. Jim Conner',
      image: null,
      role: 'Media Equipment Specialist',
      bio: 'Managing media technology with expertise and dedication to quality.',
    },
    {
      name: 'Developer and Musician Rev. Frederick Thomas',
      image: frederickThomasImg,
      role: 'Developer & Musician',
      bio: 'Combining technical innovation with musical talent to serve the ministry.',
    },
    {
      name: 'Sister Thomas',
      image: null,
      role: 'Ministry Support',
      bio: 'Supporting the mission with faithfulness and dedication.',
    },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Behind the Scenes</h1>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Leadership Team Members">
              {leadershipTeam.map((member, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={activeTab === index}
                  aria-controls={`panel-${index}`}
                  id={`tab-${index}`}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                    activeTab === index
                      ? `${colors.primaryBg} text-white shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {member.name.split(' ').slice(-2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {leadershipTeam.map((member, index) => (
              <div
                key={index}
                role="tabpanel"
                id={`panel-${index}`}
                aria-labelledby={`tab-${index}`}
                hidden={activeTab !== index}
                className={`${activeTab === index ? 'animate-fade-in' : 'hidden'}`}
              >
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full max-w-md h-auto rounded-2xl shadow-2xl object-cover"
                        style={{ maxHeight: '500px' }}
                      />
                    ) : (
                      <div className="w-full max-w-md h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl shadow-2xl flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <svg className="w-32 h-32 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <p className="text-lg font-medium">Photo Coming Soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className={`text-lg font-semibold ${colors.primaryText} mb-4`}>{member.role}</p>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
