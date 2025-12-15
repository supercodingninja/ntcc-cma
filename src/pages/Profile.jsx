import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Mail, Shield, Save } from 'lucide-react'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error:', error)
      setMessage('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        <div className="bg-white rounded-lg shadow p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-md ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2"><User className="h-4 w-4" /><span>Full Name</span></div>
              </label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>Email</span></div>
              </label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2"><Shield className="h-4 w-4" /><span>Role</span></div>
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
                <span className="text-gray-700 capitalize font-medium">{profile?.role || 'viewer'}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Contact an administrator to change your role</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white py-3 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50 font-medium flex items-center justify-center space-x-2">
              <Save className="h-5 w-5" /><span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
