import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import { TrendingUp, Clock, FileText, Music, Calendar, Download, ChevronRight, Sparkles, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalSongs: 0,
    recentPractice: [],
    topSongs: [],
    practiceThisWeek: 0
  })
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      const { count: songCount } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })

      const { data: recentPractice } = await supabase
        .from('practice_sessions')
        .select(`
          id,
          practice_date,
          duration,
          songs (
            id,
            title,
            artist
          )
        `)
        .eq('user_id', user.id)
        .order('practice_date', { ascending: false })
        .limit(5)

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { count: weekCount } = await supabase
        .from('practice_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('practice_date', oneWeekAgo.toISOString())

      const { data: topPracticed } = await supabase
        .from('practice_sessions')
        .select('song_id, songs(title, artist)')
        .eq('user_id', user.id)

      const songCounts = {}
      topPracticed?.forEach(p => {
        if (p.songs?.title) {
          const key = p.song_id
          if (!songCounts[key]) {
            songCounts[key] = { ...p.songs, count: 0 }
          }
          songCounts[key].count++
        }
      })

      const topSongs = Object.values(songCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setStats({
        totalSongs: songCount || 0,
        recentPractice: recentPractice || [],
        topSongs: topSongs || [],
        practiceThisWeek: weekCount || 0
      })

      const mockReports = [
        { id: 1, name: 'Q4 2024 CCLI Report', date: '2024-12-01', type: 'CCLI' },
        { id: 2, name: 'November Song Usage', date: '2024-11-15', type: 'Usage' },
        { id: 3, name: 'Practice Summary', date: '2024-11-01', type: 'Practice' }
      ]
      setRecentReports(mockReports)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium">Welcome back</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {profile?.full_name || 'User'}
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Your music practice overview and statistics at a glance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                <Music className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Songs</p>
              <p className="text-4xl font-bold text-slate-900">{stats.totalSongs}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">This Week</p>
              <p className="text-4xl font-bold text-slate-900">{stats.practiceThisWeek}</p>
            </div>
          </div>

          <Link to="/practice-history" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-amber-200/40 hover:border-amber-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Practice History</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">View All</p>
                <ChevronRight className="h-5 w-5 text-amber-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          </Link>

          <Link to="/reports" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-orange-200/40 hover:border-orange-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Reports</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Generate</p>
                <ChevronRight className="h-5 w-5 text-orange-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Recent Practice</h2>
                </div>
                <Link to="/practice-history" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats.recentPractice.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">No practice sessions yet</p>
                  <Link to="/practice" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30">
                    <Play className="h-4 w-4" />
                    Start Practicing
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentPractice.map(session => (
                    <div
                      key={session.id}
                      className="group p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{session.songs?.title || 'Unknown Song'}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{session.songs?.artist || 'Unknown Artist'}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.practice_date)}
                        </span>
                        {session.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Top Songs</h2>
                </div>
                <Link to="/songs" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
                  All Songs
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats.topSongs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No practice data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topSongs.map((song, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{song.title}</p>
                          <p className="text-sm text-slate-500">{song.artist || 'Unknown Artist'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{song.count}</p>
                        <p className="text-xs text-slate-400">times</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isAdmin() && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Recent Reports</h2>
                    <p className="text-sm text-slate-500">Previously generated reports</p>
                  </div>
                </div>
                <Link to="/reports" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30">
                  <FileText className="h-4 w-4" />
                  New Report
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">No reports generated yet</p>
                  <Link to="/reports" className="text-amber-600 hover:text-amber-700 font-medium">
                    Create your first report
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentReports.map(report => (
                    <div
                      key={report.id}
                      className="group p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">{report.type}</span>
                      </div>
                      <p className="font-semibold text-slate-900 group-hover:text-orange-700 transition-colors mb-1">{report.name}</p>
                      <p className="text-sm text-slate-400">{formatDate(report.date)}</p>
                      <button className="mt-3 flex items-center gap-1 text-sm text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
