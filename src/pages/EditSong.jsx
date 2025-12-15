import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { AlertCircle, Save, X } from 'lucide-react'

export default function EditSong() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '', artist: '', duration: '', lead_singer: '', key: '', tempo: '',
    lyrics: '', chords: '', copyright_info: '', youtube_url: '', notes: '', key_changes: ''
  })

  useEffect(() => {
    fetchSong()
  }, [id])

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (data) {
        setFormData({
          title: data.title || '', artist: data.artist || '', duration: data.duration || '',
          lead_singer: data.lead_singer || '', key: data.key || '', tempo: data.tempo || '',
          lyrics: data.lyrics || '', chords: data.chords || '', copyright_info: data.copyright_info || '',
          youtube_url: data.youtube_url || '', notes: data.notes || '', key_changes: data.key_changes || ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to load song')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.from('songs').update({
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        tempo: formData.tempo ? parseInt(formData.tempo) : null
      }).eq('id', id)
      if (error) throw error
      navigate(`/songs/${id}`)
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Failed to update song')
      setLoading(false)
    }
  }

  if (fetching) return <Layout><div className="text-center py-12">Loading...</div></Layout>

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Song</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Song Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
            <input type="text" name="artist" value={formData.artist} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input type="text" name="key" value={formData.key} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tempo</label>
              <input type="number" name="tempo" value={formData.tempo} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lead Singer</label>
            <input type="text" name="lead_singer" value={formData.lead_singer} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lyrics</label>
            <textarea name="lyrics" value={formData.lyrics} onChange={handleChange} rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Chords</label>
            <textarea name="chords" value={formData.chords} onChange={handleChange} rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Changes</label>
            <input type="text" name="key_changes" value={formData.key_changes} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input type="url" name="youtube_url" value={formData.youtube_url} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Copyright Info</label>
            <textarea name="copyright_info" value={formData.copyright_info} onChange={handleChange} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex space-x-4 pt-4">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-700 text-white py-3 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50 font-medium flex items-center justify-center space-x-2">
              <Save className="h-5 w-5" /><span>{loading ? 'Saving...' : 'Update Song'}</span></button>
            <button type="button" onClick={() => navigate(`/songs/${id}`)}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium flex items-center space-x-2">
              <X className="h-5 w-5" /><span>Cancel</span></button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
