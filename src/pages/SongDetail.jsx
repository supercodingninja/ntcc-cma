import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import FileViewer from '../components/FileViewer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Edit, Trash2, Music, Clock, Key as KeyIcon, Gauge, User as UserIcon, CheckCircle, FileText, Eye } from 'lucide-react'

export default function SongDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isEditor, isAdmin } = useAuth()
  const [song, setSong] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [practicing, setPracticing] = useState(false)
  const [viewingFile, setViewingFile] = useState(null)

  useEffect(() => {
    fetchSong()
    fetchFiles()
  }, [id])

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      setSong(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('song_attachments')
        .select('*')
        .eq('song_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleMarkPracticed = async () => {
    setPracticing(true)
    try {
      const { error } = await supabase.from('practice_history').insert([{
        song_id: id, practiced_by: user.id, practiced_at: new Date().toISOString()
      }])
      if (error) throw error
      alert('Practice recorded!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to record practice')
    } finally {
      setPracticing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${song?.title}"?`)) return
    try {
      const { error } = await supabase.from('songs').delete().eq('id', id)
      if (error) throw error
      navigate('/songs')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete')
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  if (loading) return <Layout><div className="text-center py-12">Loading...</div></Layout>
  if (!song) return <Layout><div className="text-center py-12"><Music className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-red-600">Song not found</p><Link to="/songs" className="text-blue-700 hover:underline mt-4 inline-block">Back to Songs</Link></div></Layout>

  const embedUrl = getYouTubeEmbedUrl(song.youtube_url)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div><h1 className="text-3xl font-bold text-gray-900">{song.title}</h1>
            {song.artist && <p className="text-xl text-gray-600 mt-2">by {song.artist}</p>}
          </div>
          <div className="flex space-x-2">
            {isEditor() && <Link to={`/songs/${id}/edit`} className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 flex items-center space-x-2"><Edit className="h-4 w-4" /><span>Edit</span></Link>}
            {isAdmin() && <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"><Trash2 className="h-4 w-4" /><span>Delete</span></button>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {song.key && <div className="bg-white p-4 rounded-lg shadow border border-gray-200"><div className="flex items-center space-x-2 text-gray-600 mb-1"><KeyIcon className="h-4 w-4" /><span className="text-sm font-medium">Key</span></div><p className="text-lg font-bold text-gray-900">{song.key}</p></div>}
          {song.tempo && <div className="bg-white p-4 rounded-lg shadow border border-gray-200"><div className="flex items-center space-x-2 text-gray-600 mb-1"><Gauge className="h-4 w-4" /><span className="text-sm font-medium">Tempo</span></div><p className="text-lg font-bold text-gray-900">{song.tempo} BPM</p></div>}
          {song.duration && <div className="bg-white p-4 rounded-lg shadow border border-gray-200"><div className="flex items-center space-x-2 text-gray-600 mb-1"><Clock className="h-4 w-4" /><span className="text-sm font-medium">Duration</span></div><p className="text-lg font-bold text-gray-900">{formatDuration(song.duration)}</p></div>}
          {song.lead_singer && <div className="bg-white p-4 rounded-lg shadow border border-gray-200"><div className="flex items-center space-x-2 text-gray-600 mb-1"><UserIcon className="h-4 w-4" /><span className="text-sm font-medium">Lead Singer</span></div><p className="text-lg font-bold text-gray-900 truncate">{song.lead_singer}</p></div>}
        </div>
        <div className="mb-8">
          <button onClick={handleMarkPracticed} disabled={practicing} className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg flex items-center justify-center space-x-2 shadow-lg">
            <CheckCircle className="h-6 w-6" /><span>{practicing ? 'Recording...' : 'Mark as Practiced'}</span>
          </button>
        </div>
        {embedUrl && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Video</h2><div className="aspect-video"><iframe src={embedUrl} className="w-full h-full rounded" allowFullScreen title="YouTube video" /></div></div>}
        {song.lyrics && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Lyrics</h2><pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{song.lyrics}</pre></div>}
        {song.chords && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Chords</h2><pre className="whitespace-pre-wrap font-mono text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded">{song.chords}</pre></div>}
        {song.key_changes && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Key Changes</h2><p className="text-gray-700">{song.key_changes}</p></div>}
        {song.copyright_info && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Copyright Information</h2><p className="text-gray-700">{song.copyright_info}</p></div>}
        {song.notes && <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2><p className="text-gray-700">{song.notes}</p></div>}

        {files.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attached Files ({files.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setViewingFile(file)}
                  className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{file.file_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {file.file_category || 'File'} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                    <Eye className="h-5 w-5 text-blue-600 group-hover:text-blue-700 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <FileViewer
        file={viewingFile}
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </Layout>
  )
}
