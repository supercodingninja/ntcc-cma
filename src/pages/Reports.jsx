import React, { useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Download, FileText, Calendar } from 'lucide-react'

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const generateCCLIReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const { data, error } = await supabase.from('practice_history').select('*, songs(title, artist, copyright_info)').gte('practiced_at', startDate).lte('practiced_at', endDate).order('practiced_at', { ascending: false })
      if (error) throw error
      const songUsage = {}
      data.forEach(practice => {
        const songTitle = practice.songs?.title || 'Unknown'
        if (!songUsage[songTitle]) {
          songUsage[songTitle] = { title: songTitle, artist: practice.songs?.artist || '', copyright: practice.songs?.copyright_info || '', count: 0 }
        }
        songUsage[songTitle].count++
      })
      const reportData = Object.values(songUsage).map(song => ({
        'Song Title': song.title, 'Artist/Composer': song.artist, 'Times Used': song.count,
        'Copyright Info': song.copyright, 'Report Period': `${startDate} to ${endDate}`
      }))
      const worksheet = XLSX.utils.json_to_sheet(reportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CCLI Report')
      const fileName = `CCLI_Report_${startDate}_to_${endDate}.xlsx`
      XLSX.writeFile(workbook, fileName)
      alert(`Report generated! Downloaded as ${fileName}`)
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to generate report: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CCLI Reports</h1>
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-8 w-8 text-blue-700" />
            <div><h2 className="text-xl font-bold text-gray-900">Generate Monthly Report</h2>
              <p className="text-sm text-gray-600">Select date range for CCLI copyright reporting</p>
            </div>
          </div>
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <div className="relative"><Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <div className="relative"><Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <button onClick={generateCCLIReport} disabled={generating}
              className="w-full bg-blue-700 text-white py-3 px-6 rounded-md hover:bg-blue-800 disabled:opacity-50 font-medium flex items-center justify-center space-x-2">
              <Download className="h-5 w-5" /><span>{generating ? 'Generating Report...' : 'Generate & Download Report'}</span>
            </button>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Report Contents:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Song titles and artists</li><li>• Number of times each song was used</li>
              <li>• Copyright information</li><li>• Date range covered</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">This report is formatted for CCLI submission requirements.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
