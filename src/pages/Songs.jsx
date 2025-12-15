import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Music, Plus, Search, Upload, FileText, Volume2, Video, Link as LinkIcon, Youtube, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Songs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [uploadedMedia, setUploadedMedia] = useState([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const { isEditor } = useAuth()

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').order('title', { ascending: true })
      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setUploadedMedia(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: file.name,
        type,
        url,
        file,
        size: file.size
      }])
    })
  }

  const addYoutubeLink = () => {
    if (youtubeUrl) {
      setUploadedMedia(prev => [...prev, {
        id: Date.now(),
        name: 'YouTube Video',
        type: 'youtube',
        url: youtubeUrl
      }])
      setYoutubeUrl('')
    }
  }

  const addExternalLink = () => {
    if (externalLink) {
      setUploadedMedia(prev => [...prev, {
        id: Date.now(),
        name: externalLink.split('/').pop() || 'External Link',
        type: 'link',
        url: externalLink
      }])
      setExternalLink('')
    }
  }

  const removeMedia = (id) => {
    setUploadedMedia(prev => prev.filter(m => m.id !== id))
  }

  const filteredSongs = songs.filter(song =>
    song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Song Library</h1>
          {isEditor() && (
            <Link to="/songs/add" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center space-x-2 shadow-lg">
              <Plus className="h-5 w-5" /><span>Add Song</span>
            </Link>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Search songs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-sm" />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowUploadSection(!showUploadSection)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Upload Media</h3>
                <p className="text-sm text-slate-500">Add files, audio, video, or links</p>
              </div>
            </div>
            <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${showUploadSection ? 'rotate-90' : ''}`} />
          </button>

          {showUploadSection && (
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:border-amber-500 hover:bg-amber-50 transition">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="font-semibold text-sm text-slate-700">Sheet Music</p>
                    <p className="text-xs text-slate-500">PDF, SIB</p>
                  </div>
                  <input type="file" multiple onChange={(e) => handleFileUpload(e, 'sheet')} className="hidden" accept=".pdf,.sib,.musicxml,.mxl" />
                </label>

                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center hover:border-emerald-500 hover:bg-emerald-50 transition">
                    <Volume2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-semibold text-sm text-slate-700">Audio</p>
                    <p className="text-xs text-slate-500">MP3, WAV</p>
                  </div>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'audio')} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac" />
                </label>

                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition">
                    <Video className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-semibold text-sm text-slate-700">Video</p>
                    <p className="text-xs text-slate-500">MP4, MOV</p>
                  </div>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" accept=".mp4,.webm,.mov,.avi" />
                </label>

                <div
                  onClick={() => document.getElementById('youtube-input').focus()}
                  className="border-2 border-dashed border-red-300 rounded-xl p-4 text-center hover:border-red-500 hover:bg-red-50 transition cursor-pointer"
                >
                  <Youtube className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="font-semibold text-sm text-slate-700">YouTube</p>
                  <p className="text-xs text-slate-500">Paste link</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <input
                    id="youtube-input"
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Paste YouTube URL..."
                    className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button onClick={addYoutubeLink} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">
                    Add
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="Add external link (URL)..."
                    className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button onClick={addExternalLink} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition">
                    Add
                  </button>
                </div>
              </div>

              {uploadedMedia.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-slate-700 mb-3">Uploaded Media ({uploadedMedia.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uploadedMedia.map(media => (
                      <div key={media.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            media.type === 'sheet' ? 'bg-amber-100 text-amber-600' :
                            media.type === 'audio' ? 'bg-emerald-100 text-emerald-600' :
                            media.type === 'video' ? 'bg-blue-100 text-blue-600' :
                            media.type === 'youtube' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {media.type === 'sheet' && <FileText className="w-4 h-4" />}
                            {media.type === 'audio' && <Volume2 className="w-4 h-4" />}
                            {media.type === 'video' && <Video className="w-4 h-4" />}
                            {media.type === 'youtube' && <Youtube className="w-4 h-4" />}
                            {media.type === 'link' && <LinkIcon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-800 truncate">{media.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{media.type}</p>
                          </div>
                        </div>
                        <button onClick={() => removeMedia(media.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-400">Loading songs...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Music className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{searchTerm ? 'No songs found matching your search.' : 'No songs yet.'}</p>
            {isEditor() && !searchTerm && <p className="text-slate-400 mt-2">Click Add Song to get started!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map((song) => (
              <Link key={song.id} to={`/songs/${song.id}`} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-100 group">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate mb-1 group-hover:text-amber-600 transition-colors">{song.title}</h3>
                    {song.artist && <p className="text-sm text-slate-600 truncate mb-2">{song.artist}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {song.key && <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-medium">Key: {song.key}</span>}
                      {song.tempo && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-medium">{song.tempo} BPM</span>}
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
