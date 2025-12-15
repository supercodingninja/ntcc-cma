# Code Completion Guide - NTCCA Legacy

This guide provides detailed instructions for completing the remaining features of the NTCCA Legacy app. All code examples follow the three-level comment structure requested.

## Overview

**What's Done:**
- ✅ Authentication (Login/Signup)
- ✅ Database schema with RLS
- ✅ App routing and navigation
- ✅ Layout and UI framework

**What Needs Completion:**
- Songs management (list, add, edit, view)
- Practice tracking
- CCLI reporting
- User management
- Profile page

---

## 1. Songs List Page (`src/pages/Songs.jsx`)

This page should display all songs with search and filter capabilities.

```jsx
// This Area Of Code Is: Songs List Page
// Explanation: Displays searchable/filterable list of all songs in the database
// In Other Words: This shows all the songs like a music library you can search through

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Music, Plus, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Songs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { isEditor } = useAuth()

  // This Area Of Code Is: Fetch Songs Function
  // Explanation: Retrieves all songs from the database when the page loads
  // In Other Words: This gets all the songs from storage and shows them on screen
  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error('Error fetching songs:', error)
    } finally {
      setLoading(false)
    }
  }

  // This Area Of Code Is: Search Filter Function
  // Explanation: Filters the song list based on user's search input
  // In Other Words: This narrows down the songs to only show ones matching your search
  const filteredSongs = songs.filter(song =>
    song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with title and add button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Song Library</h1>
          {isEditor() && (
            <Link
              to="/songs/add"
              className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Song</span>
            </Link>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs by title or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Songs grid */}
        {loading ? (
          <div className="text-center py-12">Loading songs...</div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No songs found. {isEditor() && 'Click "Add Song" to get started!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map((song) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <Music className="h-6 w-6 text-blue-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {song.title}
                    </h3>
                    {song.artist && (
                      <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {song.key && <span className="bg-gray-100 px-2 py-1 rounded">Key: {song.key}</span>}
                      {song.tempo && <span className="bg-gray-100 px-2 py-1 rounded">{song.tempo} BPM</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
```

---

## 2. Add Song Page (`src/pages/AddSong.jsx`)

Complete form for adding new songs with all required fields.

```jsx
// This Area Of Code Is: Add Song Form Page
// Explanation: Form for editors/admins to add new songs to the library
// In Other Words: This is where you fill out all the details about a new song

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AddSong() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // This Area Of Code Is: Form State Variables
  // Explanation: Stores all the song information as the user types it in
  // In Other Words: These remember what you type in each box on the form
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    duration: '',
    lead_singer: '',
    song_key: '',
    tempo: '',
    lyrics: '',
    chords: '',
    copyright_info: '',
    youtube_url: '',
    notes: '',
  })

  // This Area Of Code Is: Form Input Handler
  // Explanation: Updates state when user types in any field
  // In Other Words: This remembers what you type in each box
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // This Area Of Code Is: Form Submit Handler
  // Explanation: Saves the new song to the database
  // In Other Words: This is what happens when you click the Save button
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([{
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          tempo: formData.tempo ? parseInt(formData.tempo) : null,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      // Navigate to the new song's page
      if (data && data[0]) {
        navigate(`/songs/${data[0].id}`)
      } else {
        navigate('/songs')
      }
    } catch (error) {
      console.error('Error adding song:', error)
      setError(error.message || 'Failed to add song')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Song</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Title - Required */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Song Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Artist */}
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
              Artist/Composer
            </label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row with Key, Tempo, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="song_key" className="block text-sm font-medium text-gray-700 mb-1">
                Key
              </label>
              <input
                type="text"
                id="song_key"
                name="song_key"
                value={formData.song_key}
                onChange={handleChange}
                placeholder="e.g., C, G, D Major"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tempo" className="block text-sm font-medium text-gray-700 mb-1">
                Tempo (BPM)
              </label>
              <input
                type="number"
                id="tempo"
                name="tempo"
                value={formData.tempo}
                onChange={handleChange}
                placeholder="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="240"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lead Singer */}
          <div>
            <label htmlFor="lead_singer" className="block text-sm font-medium text-gray-700 mb-1">
              Lead Singer
            </label>
            <input
              type="text"
              id="lead_singer"
              name="lead_singer"
              value={formData.lead_singer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lyrics */}
          <div>
            <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700 mb-1">
              Lyrics
            </label>
            <textarea
              id="lyrics"
              name="lyrics"
              value={formData.lyrics}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Chords */}
          <div>
            <label htmlFor="chords" className="block text-sm font-medium text-gray-700 mb-1">
              Chords
            </label>
            <textarea
              id="chords"
              name="chords"
              value={formData.chords}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <input
              type="url"
              id="youtube_url"
              name="youtube_url"
              value={formData.youtube_url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Copyright Info */}
          <div>
            <label htmlFor="copyright_info" className="block text-sm font-medium text-gray-700 mb-1">
              Copyright Information
            </label>
            <textarea
              id="copyright_info"
              name="copyright_info"
              value={formData.copyright_info}
              onChange={handleChange}
              rows={3}
              placeholder="Publisher, CCLI #, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Song'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/songs')}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
```

---

## 3. Song Detail Page (`src/pages/SongDetail.jsx`)

View all song information and mark as practiced.

```jsx
// This Area Of Code Is: Song Detail View Page
// Explanation: Shows all information about a single song including lyrics, chords, and practice button
// In Other Words: This is like opening a song book to see all the details about one song

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Edit, Trash2, Music, Clock, Key, Gauge } from 'lucide-react'

export default function SongDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isEditor, isAdmin } = useAuth()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [practicing, setPracticing] = useState(false)

  useEffect(() => {
    fetchSong()
  }, [id])

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setSong(data)
    } catch (error) {
      console.error('Error fetching song:', error)
    } finally {
      setLoading(false)
    }
  }

  // This Area Of Code Is: Mark as Practiced Function
  // Explanation: Records that the current user practiced this song right now
  // In Other Words: This is like signing a practice sheet when you finish practicing a song
  const handleMarkPracticed = async () => {
    setPracticing(true)
    try {
      const { error } = await supabase
        .from('practice_history')
        .insert([{
          song_id: id,
          practiced_by: user.id,
          practiced_at: new Date().toISOString()
        }])

      if (error) throw error
      alert('Practice recorded!')
    } catch (error) {
      console.error('Error recording practice:', error)
      alert('Failed to record practice')
    } finally {
      setPracticing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this song?')) return

    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id)

      if (error) throw error
      navigate('/songs')
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!song) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-600">Song not found</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header with actions */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{song.title}</h1>
            {song.artist && (
              <p className="text-xl text-gray-600 mt-2">by {song.artist}</p>
            )}
          </div>

          <div className="flex space-x-2">
            {isEditor() && (
              <Link
                to={`/songs/${id}/edit`}
                className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            )}
            {isAdmin() && (
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Song metadata cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {song.song_key && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <Key className="h-4 w-4" />
                <span className="text-sm">Key</span>
              </div>
              <p className="text-lg font-bold">{song.song_key}</p>
            </div>
          )}

          {song.tempo && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <Gauge className="h-4 w-4" />
                <span className="text-sm">Tempo</span>
              </div>
              <p className="text-lg font-bold">{song.tempo} BPM</p>
            </div>
          )}

          {song.duration && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Duration</span>
              </div>
              <p className="text-lg font-bold">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</p>
            </div>
          )}

          {song.lead_singer && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <Music className="h-4 w-4" />
                <span className="text-sm">Lead Singer</span>
              </div>
              <p className="text-lg font-bold truncate">{song.lead_singer}</p>
            </div>
          )}
        </div>

        {/* Practice button */}
        <div className="mb-8">
          <button
            onClick={handleMarkPracticed}
            disabled={practicing}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {practicing ? 'Recording...' : 'Mark as Practiced'}
          </button>
        </div>

        {/* YouTube embed */}
        {song.youtube_url && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Video</h2>
            <div className="aspect-video">
              <iframe
                src={song.youtube_url.replace('watch?v=', 'embed/')}
                className="w-full h-full rounded"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Lyrics */}
        {song.lyrics && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lyrics</h2>
            <pre className="whitespace-pre-wrap font-sans text-gray-700">
              {song.lyrics}
            </pre>
          </div>
        )}

        {/* Chords */}
        {song.chords && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chords</h2>
            <pre className="whitespace-pre-wrap font-mono text-gray-700">
              {song.chords}
            </pre>
          </div>
        )}

        {/* Copyright */}
        {song.copyright_info && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Copyright Information</h2>
            <p className="text-gray-700">{song.copyright_info}</p>
          </div>
        )}

        {/* Notes */}
        {song.notes && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700">{song.notes}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

Continue in next message due to length...
