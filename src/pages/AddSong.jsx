import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import FileUploadManager from '../components/FileUploadManager'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, Save, X } from 'lucide-react'
import SibeliusUploader from '../components/SibeliusUploader'

export default function AddSong() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [songId, setSongId] = useState(null)
  const [songSaved, setSongSaved] = useState(false)
  const [formData, setFormData] = useState({
    title: '', artist: '', duration: '', lead_singer: '', key: '', tempo: '',
    lyrics: '', chords: '', copyright_info: '', youtube_url: '', notes: '', key_changes: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.from('songs').insert([{
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        tempo: formData.tempo ? parseInt(formData.tempo) : null,
        created_by: user.id
      }]).select()
      if (error) throw error
      if (data && data[0]) {
        setSongId(data[0].id)
        setSongSaved(true)
        setLoading(false)
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      } else {
        navigate('/songs')
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Failed to add song')
      setLoading(false)
    }
  }

  const handleFinish = () => {
    navigate(`/songs/${songId}`)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Song</h1>

        {songSaved && (
          <div className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Save className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900">Song Saved Successfully!</h3>
                <p className="text-sm text-green-700">Now you can upload sheet music and audio files below</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-8 animate-slide-up">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Song Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" placeholder="Enter song title" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Artist/Composer</label>
            <input type="text" name="artist" value={formData.artist} onChange={handleChange}
              className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" placeholder="Enter artist name" /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input type="text" name="key" value={formData.key} onChange={handleChange} placeholder="e.g., C, G"
                className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tempo (BPM)</label>
              <input type="number" name="tempo" value={formData.tempo} onChange={handleChange} placeholder="120"
                className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} placeholder="240"
                className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lead Singer</label>
            <input type="text" name="lead_singer" value={formData.lead_singer} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Enter lead singer name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lyrics</label>
            <textarea name="lyrics" value={formData.lyrics} onChange={handleChange} rows={8}
              className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" placeholder="Enter song lyrics..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Chords</label>
            <textarea name="chords" value={formData.chords} onChange={handleChange} rows={6}
              className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" placeholder="Enter chord progression..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Changes</label>
            <input type="text" name="key_changes" value={formData.key_changes} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g., G to A at chorus" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input type="url" name="youtube_url" value={formData.youtube_url} onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Copyright Information</label>
            <textarea name="copyright_info" value={formData.copyright_info} onChange={handleChange} rows={3}
              placeholder="Publisher, CCLI #..." className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
              className="w-full px-4 py-3 premium-input rounded-lg focus:outline-none" placeholder="Additional notes..." /></div>

          {!songSaved && (
            <div className="flex space-x-4 pt-4">
              <button type="submit" disabled={loading}
                className="flex-1 premium-button py-4 px-6 rounded-xl flex items-center justify-center space-x-2 relative z-10 disabled:opacity-50">
                <Save className="h-5 w-5" /><span>{loading ? 'Saving...' : 'Save Song'}</span>
              </button>
              <button type="button" onClick={() => navigate('/songs')}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium flex items-center space-x-2">
                <X className="h-5 w-5" /><span>Cancel</span>
              </button>
            </div>
          )}
        </form>

        {songId && songSaved && (
          <div className="mt-8 space-y-6">
            <div className="glass-panel p-6 bg-gradient-to-br from-blue-50 to-purple-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Save className="h-6 w-6 text-white" />
                </div>
                Step 2: Upload Files
              </h2>
              <p className="text-gray-700 font-medium mb-6">
                Upload your sheet music (.sib, .pdf), audio files (.mp3, .wav), and other files below.
              </p>
              <FileUploadManager songId={songId} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleFinish}
                className="flex-1 premium-button py-4 px-6 rounded-xl flex items-center justify-center gap-2 relative z-10 text-lg font-bold"
              >
                <Save className="h-6 w-6" />
                Finish & View Song
              </button>
              <button
                onClick={() => navigate('/songs/add')}
                className="px-6 py-4 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold flex items-center gap-2 transition-all"
              >
                Add Another Song
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
