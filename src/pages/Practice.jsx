import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music, Upload, FileText, Volume2, Play, Square, Clock, ZoomIn, ZoomOut,
  RotateCw, ChevronLeft, ChevronRight, Download, Mic, MicOff,
  Repeat, FastForward, Settings, Target,
  MessageSquare, Bookmark, Trash2, Plus, Minus,
  TrendingUp, Award, Calendar, BarChart2, Headphones,
  Sliders, Pause, StopCircle, Circle, Maximize2, Minimize2, X, Link, Youtube
} from 'lucide-react';
import Layout from '../components/Layout';
import { midiPlayback } from '../services/midi-playback-service';
import { audioRecording } from '../services/audio-recording-service';
import { useAuth } from '../contexts/AuthContext';

const INSTRUMENTS = [
  { id: 'piano', name: 'Piano' },
  { id: 'organ', name: 'Organ' },
  { id: 'strings', name: 'Strings' },
  { id: 'brass', name: 'Brass' },
  { id: 'flute', name: 'Flute' },
  { id: 'choir', name: 'Choir' },
  { id: 'guitar', name: 'Guitar' },
  { id: 'bass', name: 'Bass' }
];

const SCALES = [
  { id: 'major', name: 'Major' },
  { id: 'minor', name: 'Natural Minor' },
  { id: 'harmonicMinor', name: 'Harmonic Minor' },
  { id: 'pentatonic', name: 'Pentatonic' },
  { id: 'blues', name: 'Blues' }
];

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FullscreenPDFViewer = ({ pdfData, fileName, onClose }) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const containerRef = useRef(null);

  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [scale, rotation]);

  useEffect(() => {
    const loadPDF = async () => {
      if (!window.pdfjsLib) {
        setError('PDF viewer not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        setError('Failed to load PDF file.');
        setLoading(false);
      }
    };
    loadPDF();
  }, [pdfData]);

  useEffect(() => {
    if (!loading && !error && pdfDocRef.current) renderPage(pageNumber);
  }, [pageNumber, scale, rotation, loading, error, renderPage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setPageNumber(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(numPages, p + 1));
      if (e.key === 'Escape') onClose?.();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(3, s + 0.25));
      if (e.key === '-') setScale(s => Math.max(0.5, s - 0.25));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, onClose]);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={onClose} className="px-6 py-3 bg-amber-500 text-white rounded-lg">Close</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col">
      <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold truncate max-w-xs">{fileName}</h2>
          <span className="text-slate-400 text-sm">Page {pageNumber} of {numPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))} disabled={pageNumber >= numPages}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="w-px h-6 bg-slate-600 mx-2" />
          <button onClick={() => setScale(Math.max(0.5, scale - 0.25))} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(3, scale + 0.25))} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={() => setRotation((rotation + 90) % 360)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg ml-2">
            <RotateCw className="h-5 w-5" />
          </button>
          <div className="w-px h-6 bg-slate-600 mx-2" />
          <button onClick={onClose} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center items-start p-4">
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>
      <div className="p-2 bg-slate-800 border-t border-slate-700 text-center text-slate-400 text-sm">
        Use arrow keys to navigate, +/- to zoom, Esc to close
      </div>
    </div>
  );
};

const YouTubePlayer = ({ url, onClose }) => {
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p className="text-red-600">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
};

const ChromaticTuner = ({ isActive, onToggle }) => {
  const [frequency, setFrequency] = useState(0);
  const [note, setNote] = useState('');
  const [cents, setCents] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const frequencyToNote = (freq) => {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const noteName = noteStrings[roundedNote % 12];
    const octave = Math.floor(roundedNote / 12) - 1;
    const detune = noteNum - Math.round(noteNum);
    return { note: `${noteName}${octave}`, cents: Math.floor(detune * 100) };
  };

  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] += buffer[j] * buffer[j + i];

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  };

  const updatePitch = () => {
    if (!analyserRef.current) return;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const detectedFreq = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    if (detectedFreq > 0 && detectedFreq < 4000) {
      setFrequency(detectedFreq);
      const { note: noteName, cents: centsOff } = frequencyToNote(detectedFreq);
      setNote(noteName);
      setCents(centsOff);
    }
    animationFrameRef.current = requestAnimationFrame(updatePitch);
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      microphoneRef.current = stream;
      updatePitch();
    } catch (err) {
      alert('Please allow microphone access to use the tuner.');
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (microphoneRef.current) microphoneRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setFrequency(0);
    setNote('');
    setCents(0);
  };

  useEffect(() => {
    if (isActive) startListening();
    else stopListening();
    return () => stopListening();
  }, [isActive]);

  const getTuningColor = () => {
    if (!isActive || frequency === 0) return 'bg-gray-400';
    if (Math.abs(cents) <= 5) return 'bg-green-500';
    if (Math.abs(cents) <= 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-amber-600" /> Chromatic Tuner
      </h2>
      <div className="text-center">
        <button onClick={onToggle} className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg mb-4 ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
          {isActive ? <><Square className="w-5 h-5" /> Stop</> : <><Play className="w-5 h-5" /> Start</>}
        </button>
        {isActive && (
          <div className="space-y-3">
            <div className="text-5xl font-bold text-slate-900">{note || '--'}</div>
            <div className="text-lg text-slate-600">{frequency > 0 ? `${frequency.toFixed(1)} Hz` : '-- Hz'}</div>
            <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden">
              <div className={`absolute top-0 h-full transition-all duration-100 ${getTuningColor()}`}
                style={{ left: '50%', width: `${Math.abs(cents)}%`, transform: `translateX(${cents > 0 ? '0%' : '-100%'})` }} />
              <div className="absolute left-1/2 top-0 w-1 h-full bg-slate-900 transform -translate-x-1/2" />
            </div>
            <div className={`text-xl font-bold ${getTuningColor().replace('bg-', 'text-')}`}>
              {cents > 0 ? '+' : ''}{cents} cents
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Metronome = ({ isActive, onToggle, bpm, setBpm, beatsPerMeasure, setBeatsPerMeasure }) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  const playClick = (isAccent) => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isAccent ? 1200 : 800;
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  };

  useEffect(() => {
    if (isActive) {
      const interval = (60 / bpm) * 1000;
      let beat = 0;
      playClick(true);
      intervalRef.current = setInterval(() => {
        beat = (beat + 1) % beatsPerMeasure;
        setCurrentBeat(beat);
        playClick(beat === 0);
      }, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentBeat(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, bpm, beatsPerMeasure]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-600" /> Metronome
      </h2>
      <div className="text-center">
        <button onClick={onToggle} className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg mb-4 ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
          {isActive ? <><Square className="w-5 h-5" /> Stop</> : <><Play className="w-5 h-5" /> Start</>}
        </button>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Tempo: {bpm} BPM</label>
            <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-amber-200 rounded-lg cursor-pointer accent-amber-500" disabled={isActive} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Beats</label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map(b => (
                <button key={b} onClick={() => setBeatsPerMeasure(b)} disabled={isActive}
                  className={`py-2 rounded-lg font-bold transition ${beatsPerMeasure === b ? 'bg-amber-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          {isActive && (
            <div className="flex gap-2 justify-center pt-2">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${i === currentBeat ? i === 0 ? 'bg-amber-600 text-white scale-125' : 'bg-amber-400 text-white scale-110' : 'bg-slate-200'}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScaleArpeggioPlayer = () => {
  const [rootNote, setRootNote] = useState('C');
  const [scaleType, setScaleType] = useState('major');
  const [octave, setOctave] = useState(4);
  const [instrument, setInstrument] = useState('piano');
  const [isPlaying, setIsPlaying] = useState(false);

  const playScale = async () => {
    await midiPlayback.initialize();
    midiPlayback.setInstrument(instrument);
    setIsPlaying(true);
    const sequence = midiPlayback.generateScaleSequence(rootNote, scaleType, octave, 'both');
    midiPlayback.onPlaybackEnd = () => setIsPlaying(false);
    await midiPlayback.playSequence(sequence);
  };

  const stop = () => {
    midiPlayback.stop();
    setIsPlaying(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-amber-600" /> Scales & Arpeggios
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold mb-1">Root</label>
          <select value={rootNote} onChange={e => setRootNote(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
            {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Scale</label>
          <select value={scaleType} onChange={e => setScaleType(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
            {SCALES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <button onClick={isPlaying ? stop : playScale} className={`w-full py-3 rounded-xl font-bold transition ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
        {isPlaying ? 'Stop' : 'Play Scale'}
      </button>
    </div>
  );
};

const PracticeRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      await audioRecording.initialize();
      audioRecording.onStop = onRecordingComplete;
      audioRecording.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    audioRecording.stopRecording();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Mic className="w-5 h-5 text-red-500" /> Practice Recorder
      </h2>
      <div className="text-center">
        {isRecording ? (
          <>
            <div className="text-4xl font-bold text-red-500 mb-4 animate-pulse">{formatTime(recordingTime)}</div>
            <button onClick={stopRecording} className="w-full px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">
              <StopCircle className="w-6 h-6 inline mr-2" /> Stop Recording
            </button>
          </>
        ) : (
          <button onClick={startRecording} className="w-full px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">
            <Circle className="w-6 h-6 inline mr-2" /> Start Recording
          </button>
        )}
      </div>
    </div>
  );
};

const SpeedTrainer = ({ currentSpeed, setCurrentSpeed, targetSpeed, setTargetSpeed }) => {
  const [increment, setIncrement] = useState(5);

  const increaseSpeed = () => {
    const newSpeed = Math.min(currentSpeed + increment, targetSpeed);
    setCurrentSpeed(newSpeed);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" /> Speed Trainer
      </h2>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-600 mb-1">{currentSpeed}</div>
          <div className="text-sm text-slate-500">Current BPM</div>
        </div>
        <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="absolute h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
            style={{ width: `${(currentSpeed / targetSpeed) * 100}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">Target</label>
            <input type="number" min={currentSpeed} max={300} value={targetSpeed}
              onChange={e => setTargetSpeed(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Step</label>
            <select value={increment} onChange={e => setIncrement(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm">
              <option value={2}>+2</option>
              <option value={5}>+5</option>
              <option value={10}>+10</option>
            </select>
          </div>
        </div>
        <button onClick={increaseSpeed} disabled={currentSpeed >= targetSpeed}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-bold">
          <FastForward className="w-5 h-5 inline mr-2" /> Increase
        </button>
      </div>
    </div>
  );
};

const Practice = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tools');
  const [tunerActive, setTunerActive] = useState(false);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(80);
  const [targetSpeed, setTargetSpeed] = useState(120);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => setPracticeTimer(t => t + 1), 1000);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timerActive]);

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const fileData = { name: file.name, size: file.size, file, uploadDate: new Date().toISOString(), type: ext };
      setUploadedFiles(prev => [...prev, fileData]);

      if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
      }
    });
  };

  const parseFile = (fileData) => {
    const { file, name } = fileData;
    const ext = name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => setFileContent({ type: 'pdf', data: e.target.result, fileName: name });
      reader.readAsArrayBuffer(file);
    } else if (ext === 'sib') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent({
          type: 'sib',
          data: e.target.result,
          fileName: name,
          fileSize: file.size,
          extractedInfo: { title: name.replace('.sib', ''), timeSignatures: ['4/4'] }
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setFileContent({ type: 'audio', url, fileName: name });
    }

    setActiveTab('score');
  };

  const addYoutubeLink = () => {
    if (youtubeUrl) {
      setFileContent({ type: 'youtube', url: youtubeUrl, fileName: 'YouTube Video' });
      setShowYoutubeInput(false);
      setActiveTab('score');
    }
  };

  return (
    <Layout>
      {isFullscreen && fileContent?.type === 'pdf' && (
        <FullscreenPDFViewer
          pdfData={fileContent.data}
          fileName={fileContent.fileName}
          onClose={() => setIsFullscreen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Practice Studio</h1>
            <p className="text-slate-300">Professional music practice tools</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl px-6 py-3 shadow-lg">
              <div className="text-sm text-slate-500">Session Time</div>
              <div className="text-2xl font-bold text-amber-600">{formatTime(practiceTimer)}</div>
            </div>
            <button onClick={() => setTimerActive(!timerActive)}
              className={`p-4 rounded-xl shadow-lg ${timerActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
              {timerActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'tools', label: 'Practice Tools', icon: Sliders },
            { id: 'score', label: 'Score View', icon: FileText },
            { id: 'training', label: 'Training', icon: Target },
            { id: 'recording', label: 'Recording', icon: Mic }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChromaticTuner isActive={tunerActive} onToggle={() => setTunerActive(!tunerActive)} />
            <Metronome isActive={metronomeActive} onToggle={() => setMetronomeActive(!metronomeActive)}
              bpm={bpm} setBpm={setBpm} beatsPerMeasure={beatsPerMeasure} setBeatsPerMeasure={setBeatsPerMeasure} />
            <ScaleArpeggioPlayer />
            <SpeedTrainer currentSpeed={currentSpeed} setCurrentSpeed={setCurrentSpeed}
              targetSpeed={targetSpeed} setTargetSpeed={setTargetSpeed} />

            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 md:col-span-2">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" /> Upload Music
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                    <p className="font-semibold text-slate-700">Sheet Music</p>
                    <p className="text-sm text-slate-500">PDF, SIB, MusicXML</p>
                  </div>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.sib,.musicxml,.mxl" />
                </label>

                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition">
                    <Volume2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p className="font-semibold text-slate-700">Audio Files</p>
                    <p className="text-sm text-slate-500">MP3, WAV, M4A</p>
                  </div>
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".mp3,.wav,.ogg,.m4a" />
                </label>
              </div>

              <div className="mt-4">
                {showYoutubeInput ? (
                  <div className="flex gap-2">
                    <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Paste YouTube URL..." className="flex-1 p-3 border rounded-lg" />
                    <button onClick={addYoutubeLink} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold">Add</button>
                    <button onClick={() => setShowYoutubeInput(false)} className="px-4 py-2 bg-slate-200 rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowYoutubeInput(true)}
                    className="w-full py-3 bg-red-50 border-2 border-dashed border-red-300 rounded-xl text-red-600 font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2">
                    <Youtube className="w-5 h-5" /> Add YouTube Link
                  </button>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-slate-600">Uploaded Files:</p>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} onClick={() => parseFile(f)}
                      className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate">{f.name}</p>
                        <p className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-6">
            {fileContent?.type === 'pdf' ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">{fileContent.fileName}</h2>
                  <button onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition">
                    <Maximize2 className="w-4 h-4" /> Fullscreen View
                  </button>
                </div>
                <div className="p-6 text-center">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 mb-4">PDF loaded and ready</p>
                  <button onClick={() => setIsFullscreen(true)}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
                    <Maximize2 className="w-5 h-5 inline mr-2" /> Open Full Score View
                  </button>
                </div>
              </div>
            ) : fileContent?.type === 'youtube' ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold text-slate-800 mb-4">YouTube Video</h2>
                <YouTubePlayer url={fileContent.url} />
              </div>
            ) : fileContent?.type === 'audio' ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold text-slate-800 mb-4">{fileContent.fileName}</h2>
                <audio controls className="w-full" src={fileContent.url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : fileContent?.type === 'sib' ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold text-slate-800 mb-4">{fileContent.fileName}</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <p className="text-amber-800 mb-4">
                    Sibelius files require the desktop application for full viewing.
                    Basic metadata extracted:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-slate-500">Title</p>
                      <p className="font-bold">{fileContent.extractedInfo?.title}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-slate-500">Time Signature</p>
                      <p className="font-bold">{fileContent.extractedInfo?.timeSignatures?.[0] || '4/4'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-2">No file loaded</p>
                <p className="text-slate-400 text-sm">Upload a PDF, audio file, or add a YouTube link from Practice Tools</p>
              </div>
            )}

            {audioUrl && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-600" /> Audio Player
                </h3>
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpeedTrainer currentSpeed={currentSpeed} setCurrentSpeed={setCurrentSpeed}
              targetSpeed={targetSpeed} setTargetSpeed={setTargetSpeed} />
            <ScaleArpeggioPlayer />
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Practice Goals
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Daily Practice</span>
                    <span className="text-sm text-amber-600">{formatTime(practiceTimer)} / 30:00</span>
                  </div>
                  <div className="h-3 bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, (practiceTimer / 1800) * 100)}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tempo Target</span>
                    <span className="text-sm text-emerald-600">{currentSpeed}/{targetSpeed} BPM</span>
                  </div>
                  <div className="h-3 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(currentSpeed / targetSpeed) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recording' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PracticeRecorder onRecordingComplete={(result) => console.log('Recording complete:', result)} />
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" /> Recording Analysis
              </h2>
              <div className="text-center py-8 text-slate-500">
                <Headphones className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Record a practice session to see analysis</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Practice;
