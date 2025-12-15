import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Download, ExternalLink, FileText, Music as MusicIcon,
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight,
  Play, Pause, Volume2, Maximize2, Minimize2, Eye, FileCode,
  Clock, Users, Hash, Layers, RefreshCw
} from 'lucide-react'

export default function FileViewer({ file, isOpen, onClose }) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [sibData, setSibData] = useState(null)
  const [sibLoading, setSibLoading] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const getFileType = useCallback(() => {
    const fileName = file?.file_name || ''
    return fileName.split('.').pop()?.toLowerCase() || ''
  }, [file])

  const fileUrl = file?.file_url || file?.external_url

  const isPDF = () => getFileType() === 'pdf'
  const isSibelius = () => getFileType() === 'sib'
  const isAudio = () => ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(getFileType())
  const isVideo = () => ['mp4', 'webm', 'mov', 'avi'].includes(getFileType())
  const isImage = () => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(getFileType())
  const isText = () => ['txt', 'md', 'log', 'rtf'].includes(getFileType())
  const isCode = () => ['json', 'xml', 'csv', 'html', 'css', 'js'].includes(getFileType())
  const isWord = () => ['doc', 'docx'].includes(getFileType())
  const isExcel = () => ['xls', 'xlsx'].includes(getFileType())
  const isMidi = () => ['mid', 'midi'].includes(getFileType())
  const isMusicXML = () => ['musicxml', 'mxl'].includes(getFileType())

  useEffect(() => {
    if (isOpen && file) {
      setCurrentPage(1)
      setScale(1.0)
      setRotation(0)
      setPdfDoc(null)
      setPdfError(null)
      setSibData(null)
      setTextContent('')
      setActiveTab('preview')

      if (isPDF()) {
        loadPDF()
      } else if (isSibelius()) {
        loadSibeliusFile()
      } else if (isText() || isCode()) {
        loadTextFile()
      }
    }
  }, [isOpen, file])

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, scale, rotation])

  const loadPDF = async () => {
    if (!fileUrl || !window.pdfjsLib) {
      setPdfError('PDF viewer not available. Please download the file.')
      return
    }

    setPdfLoading(true)
    setPdfError(null)

    try {
      const loadingTask = window.pdfjsLib.getDocument({
        url: fileUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
      })

      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
    } catch (error) {
      console.error('PDF load error:', error)
      setPdfError(`Failed to load PDF: ${error.message}`)
    } finally {
      setPdfLoading(false)
    }
  }

  const renderPage = async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      const viewport = page.getViewport({ scale, rotation })
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
    } catch (error) {
      console.error('Page render error:', error)
    }
  }

  const loadSibeliusFile = async () => {
    if (!fileUrl) return

    setSibLoading(true)

    try {
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      const parsed = parseSibeliusBuffer(arrayBuffer)
      setSibData(parsed)
    } catch (error) {
      console.error('Sibelius parse error:', error)
      setSibData({
        error: true,
        message: 'Could not parse Sibelius file',
        fileSize: file?.file_size,
        fileName: file?.file_name
      })
    } finally {
      setSibLoading(false)
    }
  }

  const parseSibeliusBuffer = (buffer) => {
    const data = new Uint8Array(buffer)
    const textDecoder = new TextDecoder('utf-8', { fatal: false })

    let rawText = ''
    try {
      rawText = textDecoder.decode(data)
    } catch (e) {
      for (let i = 0; i < Math.min(data.length, 50000); i++) {
        if (data[i] >= 32 && data[i] < 127) {
          rawText += String.fromCharCode(data[i])
        } else if (data[i] === 10 || data[i] === 13) {
          rawText += '\n'
        }
      }
    }

    const result = {
      fileSize: buffer.byteLength,
      rawData: data,
      extractedText: rawText,
      title: extractPattern(rawText, /title[:\s]+([^\n\r]+)/i) || 'Unknown Title',
      composer: extractPattern(rawText, /composer[:\s]+([^\n\r]+)/i) || extractPattern(rawText, /by[:\s]+([^\n\r]+)/i),
      instruments: extractInstruments(rawText),
      tempo: extractPattern(rawText, /tempo[:\s]*(\d+)/i) || extractPattern(rawText, /bpm[:\s]*(\d+)/i),
      timeSignature: extractPattern(rawText, /(\d+\/\d+)/),
      keySignature: extractKeySignature(rawText),
      measures: extractPattern(rawText, /measures?[:\s]*(\d+)/i) || estimateMeasures(data),
      dynamics: extractDynamics(rawText),
      hasLyrics: rawText.toLowerCase().includes('lyric') || /\b(verse|chorus|bridge)\b/i.test(rawText),
      hasMidi: containsMidiData(data),
      version: extractPattern(rawText, /sibelius[^\d]*(\d+[\d.]*)/i) || 'Unknown'
    }

    return result
  }

  const extractPattern = (text, pattern) => {
    const match = text.match(pattern)
    return match ? match[1].trim() : null
  }

  const extractInstruments = (text) => {
    const instrumentPatterns = [
      /piano/gi, /violin/gi, /viola/gi, /cello/gi, /bass/gi,
      /flute/gi, /oboe/gi, /clarinet/gi, /bassoon/gi,
      /trumpet/gi, /horn/gi, /trombone/gi, /tuba/gi,
      /drums/gi, /percussion/gi, /timpani/gi,
      /guitar/gi, /harp/gi, /organ/gi,
      /soprano/gi, /alto/gi, /tenor/gi, /baritone/gi,
      /voice/gi, /choir/gi, /satb/gi
    ]

    const found = new Set()
    instrumentPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(m => found.add(m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()))
      }
    })

    return Array.from(found)
  }

  const extractKeySignature = (text) => {
    const keys = ['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major',
                  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major',
                  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor',
                  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor']

    for (const key of keys) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return key
      }
    }

    const keyMatch = text.match(/key[:\s]+([A-Ga-g][#b]?\s*(major|minor)?)/i)
    return keyMatch ? keyMatch[1] : null
  }

  const extractDynamics = (text) => {
    const dynamics = []
    if (/\bppp?\b/i.test(text)) dynamics.push('pp')
    if (/\bpiano\b/i.test(text) && /\bdynamic/i.test(text)) dynamics.push('p')
    if (/\bmp\b/i.test(text)) dynamics.push('mp')
    if (/\bmf\b/i.test(text)) dynamics.push('mf')
    if (/\bforte\b/i.test(text)) dynamics.push('f')
    if (/\bff\b/i.test(text)) dynamics.push('ff')
    if (/crescendo/i.test(text)) dynamics.push('crescendo')
    if (/decrescendo|diminuendo/i.test(text)) dynamics.push('diminuendo')
    return dynamics
  }

  const estimateMeasures = (data) => {
    let count = 0
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] === 0x90 || data[i] === 0x80) count++
    }
    return count > 0 ? Math.floor(count / 16) : null
  }

  const containsMidiData = (data) => {
    for (let i = 0; i < data.length - 4; i++) {
      if (data[i] === 0x4D && data[i+1] === 0x54 &&
          data[i+2] === 0x68 && data[i+3] === 0x64) {
        return true
      }
    }
    return false
  }

  const loadTextFile = async () => {
    if (!fileUrl) return

    try {
      const response = await fetch(fileUrl)
      const text = await response.text()
      setTextContent(text)
    } catch (error) {
      console.error('Text file load error:', error)
      setTextContent('Error loading file content')
    }
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages))

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!isOpen || !file) return null

  const renderPDFViewer = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 border-b">
        <button onClick={handlePrevPage} disabled={currentPage <= 1}
          className="p-2 hover:bg-gray-200 rounded disabled:opacity-50">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium px-3">
          Page {currentPage} of {numPages}
        </span>
        <button onClick={handleNextPage} disabled={currentPage >= numPages}
          className="p-2 hover:bg-gray-200 rounded disabled:opacity-50">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-200 rounded">
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium w-16 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-200 rounded">
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button onClick={handleRotate} className="p-2 hover:bg-gray-200 rounded">
          <RotateCw className="h-5 w-5" />
        </button>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-200 rounded">
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-200 p-4 flex justify-center">
        {pdfLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading PDF...</span>
          </div>
        )}
        {pdfError && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{pdfError}</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <ExternalLink className="h-4 w-4" /> Open in New Tab
            </a>
          </div>
        )}
        {!pdfLoading && !pdfError && (
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        )}
      </div>
    </div>
  )

  const renderSibeliusViewer = () => (
    <div className="p-6 space-y-6">
      {sibLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Parsing Sibelius file...</span>
        </div>
      ) : sibData ? (
        <>
          <div className="flex border-b">
            <button onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium ${activeTab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              <Eye className="h-4 w-4 inline mr-2" />Score Preview
            </button>
            <button onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              <FileText className="h-4 w-4 inline mr-2" />File Info
            </button>
            <button onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 font-medium ${activeTab === 'raw' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              <FileCode className="h-4 w-4 inline mr-2" />Raw Data
            </button>
          </div>

          {activeTab === 'preview' && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">{sibData.title || file.file_name}</h3>
              {sibData.composer && <p className="text-gray-600 mb-4">Composed by: {sibData.composer}</p>}

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <svg viewBox="0 0 800 200" className="w-full h-auto">
                  <line x1="50" y1="50" x2="750" y2="50" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="60" x2="750" y2="60" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="70" x2="750" y2="70" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="80" x2="750" y2="80" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="90" x2="750" y2="90" stroke="#333" strokeWidth="1" />

                  <text x="20" y="75" fontSize="32" fontFamily="serif">&#119070;</text>

                  {sibData.keySignature && (
                    <text x="60" y="75" fontSize="14" fontFamily="serif">{sibData.keySignature}</text>
                  )}
                  {sibData.timeSignature && (
                    <text x="100" y="78" fontSize="16" fontWeight="bold">{sibData.timeSignature}</text>
                  )}

                  <ellipse cx="150" cy="70" rx="8" ry="6" fill="#333" />
                  <line x1="158" y1="70" x2="158" y2="40" stroke="#333" strokeWidth="2" />

                  <ellipse cx="200" cy="60" rx="8" ry="6" fill="#333" />
                  <line x1="208" y1="60" x2="208" y2="30" stroke="#333" strokeWidth="2" />

                  <ellipse cx="250" cy="80" rx="8" ry="6" fill="#333" />
                  <line x1="258" y1="80" x2="258" y2="50" stroke="#333" strokeWidth="2" />

                  <ellipse cx="300" cy="75" rx="8" ry="6" fill="#333" />
                  <line x1="308" y1="75" x2="308" y2="45" stroke="#333" strokeWidth="2" />

                  <line x1="350" y1="50" x2="350" y2="90" stroke="#333" strokeWidth="2" />

                  <ellipse cx="400" cy="65" rx="8" ry="6" fill="none" stroke="#333" strokeWidth="2" />
                  <line x1="408" y1="65" x2="408" y2="35" stroke="#333" strokeWidth="2" />

                  <ellipse cx="500" cy="70" rx="8" ry="6" fill="#333" />
                  <line x1="508" y1="70" x2="508" y2="40" stroke="#333" strokeWidth="2" />

                  <line x1="50" y1="120" x2="750" y2="120" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="130" x2="750" y2="130" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="140" x2="750" y2="140" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="150" x2="750" y2="150" stroke="#333" strokeWidth="1" />
                  <line x1="50" y1="160" x2="750" y2="160" stroke="#333" strokeWidth="1" />

                  <text x="20" y="148" fontSize="32" fontFamily="serif">&#119074;</text>
                </svg>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Visual representation of score structure
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sibData.tempo && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Clock className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs text-gray-500">Tempo</p>
                    <p className="font-bold">{sibData.tempo} BPM</p>
                  </div>
                )}
                {sibData.timeSignature && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <Hash className="h-5 w-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-gray-500">Time Sig</p>
                    <p className="font-bold">{sibData.timeSignature}</p>
                  </div>
                )}
                {sibData.keySignature && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <MusicIcon className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs text-gray-500">Key</p>
                    <p className="font-bold">{sibData.keySignature}</p>
                  </div>
                )}
                {sibData.measures && (
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <Layers className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                    <p className="text-xs text-gray-500">Measures</p>
                    <p className="font-bold">~{sibData.measures}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">File Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">File Name</p>
                    <p className="font-medium">{file.file_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">File Size</p>
                    <p className="font-medium">{(sibData.fileSize / 1024).toFixed(2)} KB</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sibelius Version</p>
                    <p className="font-medium">{sibData.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contains MIDI</p>
                    <p className="font-medium">{sibData.hasMidi ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {sibData.instruments?.length > 0 && (
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Detected Instruments ({sibData.instruments.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sibData.instruments.map((inst, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sibData.dynamics?.length > 0 && (
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Dynamics Found</h3>
                  <div className="flex flex-wrap gap-2">
                    {sibData.dynamics.map((dyn, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium italic">
                        {dyn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> For full editing and playback, open this file in Sibelius, Finale, or MuseScore.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap break-all">
                {sibData.extractedText?.slice(0, 5000) || 'No readable text content found'}
                {sibData.extractedText?.length > 5000 && '\n\n... [truncated]'}
              </pre>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <a href={fileUrl} download={file.file_name}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
              <Download className="h-5 w-5" /> Download File
            </a>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all">
              <ExternalLink className="h-5 w-5" /> Open in New Tab
            </a>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <MusicIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Unable to parse file</p>
        </div>
      )}
    </div>
  )

  const renderAudioPlayer = () => (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <Volume2 className="h-12 w-12 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{file.file_name}</h3>
      <p className="text-gray-500 mb-6">{getFileType().toUpperCase()} Audio File</p>
      <audio controls className="w-full max-w-2xl" src={fileUrl}>
        Your browser does not support the audio element.
      </audio>
    </div>
  )

  const renderVideoPlayer = () => (
    <div className="flex flex-col items-center justify-center py-6 px-6">
      <video controls className="w-full max-w-4xl rounded-lg shadow-lg" src={fileUrl}>
        Your browser does not support the video element.
      </video>
    </div>
  )

  const renderImageViewer = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100">
      <img src={fileUrl} alt={file.file_name}
        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }} />
      <div className="flex gap-2 mt-4">
        <button onClick={handleZoomOut} className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
          <ZoomOut className="h-5 w-5" />
        </button>
        <button onClick={handleZoomIn} className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
          <ZoomIn className="h-5 w-5" />
        </button>
        <button onClick={handleRotate} className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
          <RotateCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  )

  const renderTextViewer = () => (
    <div className="p-6">
      <pre className="bg-gray-50 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[60vh] whitespace-pre-wrap">
        {textContent || 'Loading...'}
      </pre>
    </div>
  )

  const renderGenericViewer = () => (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="h-10 w-10 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{file.file_name}</h3>
      <p className="text-gray-600 mb-6">
        {getFileType().toUpperCase()} file - Preview not available in browser
      </p>
      <div className="flex gap-3 justify-center">
        <a href={fileUrl} download={file.file_name}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
          <Download className="h-5 w-5" /> Download
        </a>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all">
          <ExternalLink className="h-5 w-5" /> Open in New Tab
        </a>
      </div>
    </div>
  )

  const renderContent = () => {
    if (isPDF()) return renderPDFViewer()
    if (isSibelius()) return renderSibeliusViewer()
    if (isAudio()) return renderAudioPlayer()
    if (isVideo()) return renderVideoPlayer()
    if (isImage()) return renderImageViewer()
    if (isText() || isCode()) return renderTextViewer()
    return renderGenericViewer()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div ref={containerRef}
        className={`bg-white rounded-2xl w-full max-w-5xl flex flex-col shadow-2xl ${isFullscreen ? 'max-w-none h-full rounded-none' : 'max-h-[90vh]'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              {isPDF() ? <FileText className="h-5 w-5 text-white" /> :
               isSibelius() ? <MusicIcon className="h-5 w-5 text-white" /> :
               isAudio() ? <Volume2 className="h-5 w-5 text-white" /> :
               <FileText className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 truncate max-w-md">{file.file_name}</h2>
              <p className="text-sm text-gray-600">
                {getFileType().toUpperCase()} {file.file_size && `- ${(file.file_size / 1024).toFixed(2)} KB`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fileUrl && (
              <>
                <a href={fileUrl} download={file.file_name} title="Download"
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <Download className="h-5 w-5 text-gray-700" />
                </a>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab"
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <ExternalLink className="h-5 w-5 text-gray-700" />
                </a>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
