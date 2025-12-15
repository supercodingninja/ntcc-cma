class AudioRecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.duration = 0;
    this.onDataAvailable = null;
    this.onStop = null;
    this.onAnalysis = null;
    this.waveformData = [];
    this.pitchHistory = [];
    this.volumeHistory = [];
  }

  async initialize() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.duration = (Date.now() - this.startTime) / 1000;
        if (this.onStop) {
          this.onStop({
            blob: audioBlob,
            duration: this.duration,
            waveform: this.waveformData,
            pitchHistory: this.pitchHistory,
            volumeHistory: this.volumeHistory
          });
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw error;
    }
  }

  getSupportedMimeType() {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    return mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
  }

  startRecording() {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }

    this.audioChunks = [];
    this.waveformData = [];
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.startTime = Date.now();
    this.isRecording = true;
    this.isPaused = false;

    this.mediaRecorder.start(100);
    this.startAnalysis();
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      this.isPaused = false;
      this.mediaRecorder.stop();
      this.stopAnalysis();
    }
  }

  startAnalysis() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.isRecording) return;

      this.analyser.getFloatTimeDomainData(dataArray);
      this.analyser.getByteFrequencyData(frequencyData);

      let rms = 0;
      for (let i = 0; i < bufferLength; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / bufferLength);
      const volume = Math.min(1, rms * 10);

      const pitch = this.detectPitch(dataArray, this.audioContext.sampleRate);

      const snapshot = Array.from(dataArray.slice(0, 128));
      this.waveformData.push(snapshot);
      this.volumeHistory.push(volume);
      if (pitch > 0) {
        this.pitchHistory.push({ time: Date.now() - this.startTime, pitch, volume });
      }

      if (this.onAnalysis) {
        this.onAnalysis({
          volume,
          pitch,
          waveform: snapshot,
          frequency: Array.from(frequencyData.slice(0, 64))
        });
      }

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  stopAnalysis() {}

  detectPitch(buffer, sampleRate) {
    const SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const buf = buffer.slice(r1, r2);
    const newSize = buf.length;

    const c = new Array(newSize).fill(0);
    for (let i = 0; i < newSize; i++) {
      for (let j = 0; j < newSize - i; j++) {
        c[i] += buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;

    let maxval = -1, maxpos = -1;
    for (let i = d; i < newSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 > 0 && T0 < newSize - 1) {
      const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }

    return sampleRate / T0;
  }

  frequencyToNote(frequency) {
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const noteName = noteStrings[roundedNote % 12];
    const octave = Math.floor(roundedNote / 12) - 1;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    return { note: `${noteName}${octave}`, cents, frequency };
  }

  analyzePitchAccuracy(targetPitches) {
    if (!this.pitchHistory.length || !targetPitches.length) return null;

    let totalError = 0;
    let matchedNotes = 0;

    targetPitches.forEach((target, index) => {
      const windowStart = (target.time - 100);
      const windowEnd = (target.time + 100);

      const detectedInWindow = this.pitchHistory.filter(
        p => p.time >= windowStart && p.time <= windowEnd
      );

      if (detectedInWindow.length > 0) {
        const avgPitch = detectedInWindow.reduce((sum, p) => sum + p.pitch, 0) / detectedInWindow.length;
        const centsError = 1200 * Math.log2(avgPitch / target.pitch);
        totalError += Math.abs(centsError);
        matchedNotes++;
      }
    });

    const avgError = matchedNotes > 0 ? totalError / matchedNotes : 100;
    const accuracy = Math.max(0, 100 - (avgError / 2));

    return {
      accuracy: Math.round(accuracy),
      matchedNotes,
      totalNotes: targetPitches.length,
      avgCentsError: Math.round(totalError / Math.max(1, matchedNotes))
    };
  }

  analyzeRhythmAccuracy(targetOnsets) {
    if (!this.volumeHistory.length || !targetOnsets.length) return null;

    const detectedOnsets = [];
    const threshold = 0.3;
    let wasAboveThreshold = false;

    this.volumeHistory.forEach((volume, index) => {
      const time = (index / this.volumeHistory.length) * this.duration * 1000;
      if (volume > threshold && !wasAboveThreshold) {
        detectedOnsets.push(time);
      }
      wasAboveThreshold = volume > threshold;
    });

    let totalError = 0;
    let matchedOnsets = 0;

    targetOnsets.forEach(target => {
      const closest = detectedOnsets.reduce((prev, curr) =>
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
      , detectedOnsets[0] || 0);

      const error = Math.abs(closest - target);
      if (error < 200) {
        totalError += error;
        matchedOnsets++;
      }
    });

    const avgError = matchedOnsets > 0 ? totalError / matchedOnsets : 200;
    const accuracy = Math.max(0, 100 - (avgError / 2));

    return {
      accuracy: Math.round(accuracy),
      matchedOnsets,
      totalOnsets: targetOnsets.length,
      avgMsError: Math.round(avgError)
    };
  }

  getRecordingBlob() {
    if (this.audioChunks.length === 0) return null;
    return new Blob(this.audioChunks, { type: 'audio/webm' });
  }

  async getAudioBuffer() {
    const blob = this.getRecordingBlob();
    if (!blob) return null;

    const arrayBuffer = await blob.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  generateWaveformImage(width = 800, height = 100) {
    if (!this.waveformData.length) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const step = Math.ceil(this.waveformData.length / width);
    const middle = height / 2;

    for (let i = 0; i < width; i++) {
      const dataIndex = Math.floor(i * step);
      if (dataIndex < this.waveformData.length) {
        const samples = this.waveformData[dataIndex];
        const avg = samples.reduce((a, b) => a + Math.abs(b), 0) / samples.length;
        const amplitude = avg * height * 2;

        if (i === 0) {
          ctx.moveTo(i, middle - amplitude);
        } else {
          ctx.lineTo(i, middle - amplitude);
        }
      }
    }

    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const dataIndex = Math.floor(i * step);
      if (dataIndex < this.waveformData.length) {
        const samples = this.waveformData[dataIndex];
        const avg = samples.reduce((a, b) => a + Math.abs(b), 0) / samples.length;
        const amplitude = avg * height * 2;

        if (i === 0) {
          ctx.moveTo(i, middle + amplitude);
        } else {
          ctx.lineTo(i, middle + amplitude);
        }
      }
    }
    ctx.stroke();

    return canvas.toDataURL('image/png');
  }

  dispose() {
    this.stopRecording();
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
  }
}

export const audioRecording = new AudioRecordingService();
export default audioRecording;
