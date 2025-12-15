import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Calendar, Music, User } from 'lucide-react'

export default function PracticeHistory() {
  const [practices, setPractices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPractices()
  }, [])

  const fetchPractices = async () => {
    try {
      const { data, error } = await supabase.from('practice_history').select('*, songs(title), profiles(full_name, email)').order('practiced_at', { ascending: false }).limit(100)
      if (error) throw error
      setPractices(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Practice History</h1>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : practices.length === 0 ? (
          <div className="text-center py-12"><Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No practice history yet.</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Song</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Practiced By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {practices.map((practice) => (
                  <tr key={practice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/songs/${practice.song_id}`} className="flex items-center space-x-2 text-blue-700 hover:text-blue-800">
                        <Music className="h-4 w-4" /><span className="font-medium">{practice.songs?.title || 'Unknown Song'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-900">
                        <User className="h-4 w-4 text-gray-400" /><span>{practice.profiles?.full_name || practice.profiles?.email || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2"><Calendar className="h-4 w-4" /><span>{formatDate(practice.practiced_at)}</span></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
