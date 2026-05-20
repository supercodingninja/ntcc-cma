// ============================================================
// FILE: src/lib/utils.ts
// NTCC Music App — Utility Functions & Helpers
// ============================================================

// This Area Of Code Is: Date & Time Formatting Utilities
// Explanation: Consistent date/time display across the app.
//              Handles locale-aware formatting, relative time ("2 hours ago"),
//              and worship-service-specific time formats.
// In Other Words: These functions make dates look pretty and readable —
//                  turning "2026-04-26T07:53:00Z" into "Today at 7:53 AM" or "2 hours ago".

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid date'

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return d.toLocaleDateString('en-US', defaultOptions)
}

export function formatTime(date: string | Date, includeSeconds = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid time'

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  })
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

// ============================================================
// This Area Of Code Is: String & Text Utilities
// Explanation: Text manipulation helpers for display, search, and sanitization.
//              Includes slug generation, truncation, title case, and search normalization.
// In Other Words: These functions clean up and format text — making titles look proper,
//                  creating URL-friendly names, and helping search work better.

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + suffix
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
}

export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function highlightMatch(text: string, query: string): string {
  if (!query) return text
  const normalizedQuery = normalizeSearchQuery(query)
  const regex = new RegExp(`(${normalizedQuery})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// ============================================================
// This Area Of Code Is: Validation & Sanitization Utilities
// Explanation: Input validation for forms, emails, passwords, and file uploads.
//              Prevents bad data from entering the database and protects against injection.
// In Other Words: These are the "bouncers" — they check if emails look real,
//                  passwords are strong enough, and files are the right type.

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  return emailRegex.test(email)
}

export function isStrongPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  if (!/[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(password)) {
    errors.push('At least one special character')
  }

  return { isValid: errors.length === 0, errors }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.includes('*')) {
      const [category] = type.split('/')
      return file.type.startsWith(`${category}/`)
    }
    return file.type === type
  })
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000)
}

export function isEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0
}

export function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined
}

// ============================================================
// This Area Of Code Is: Music Theory & Chord Utilities
// Explanation: Musical calculations for key transposition, chord parsing,
//              note frequency conversion, and notation translation.
//              Supports English, Spanish, German, and numeric notation systems.
// In Other Words: These are the "music brain" functions — they figure out
//                  what note comes next, how to change keys, and how chords work.

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export const SPANISH_NOTES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']

export const GERMAN_NOTES = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'Ais', 'H']

export const NUMERIC_NOTES = ['1', '1#', '2', '2#', '3', '4', '4#', '5', '5#', '6', '6#', '7']

export function getNoteIndex(note: string, notation: 'english' | 'spanish' | 'german' | 'numeric' = 'english'): number {
  const map: Record<string, string[]> = {
    english: NOTES,
    spanish: SPANISH_NOTES,
    german: GERMAN_NOTES,
    numeric: NUMERIC_NOTES,
  }

  const notes = map[notation] || NOTES
  return notes.findIndex(n => n.toLowerCase() === note.toLowerCase())
}

export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  const notePattern = /^([A-G][#b]?)(.*)$/
  const match = chord.match(notePattern)

  if (!match) return chord

  const [, root, suffix] = match
  const notes = useFlats ? NOTES_FLAT : NOTES
  const index = notes.findIndex(n => n.toLowerCase() === root.toLowerCase())

  if (index === -1) return chord

  const newIndex = (index + semitones + 12) % 12
  return notes[newIndex] + suffix
}

export function transposeKey(key: string, semitones: number): string {
  return transposeChord(key, semitones)
}

export function noteToFrequency(note: string, octave: number = 4): number {
  const index = getNoteIndex(note)
  if (index === -1) return 0

  const a4 = 440
  const a4Index = getNoteIndex('A')
  const semitonesFromA4 = (octave - 4) * 12 + (index - a4Index)

  return a4 * Math.pow(2, semitonesFromA4 / 12)
}

export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  const a4 = 440
  const semitones = 12 * Math.log2(frequency / a4)
  const roundedSemitones = Math.round(semitones)
  const cents = Math.round((semitones - roundedSemitones) * 100)

  const noteIndex = ((roundedSemitones + 9) % 12 + 12) % 12
  const octave = 4 + Math.floor((roundedSemitones + 9) / 12)

  return { note: NOTES[noteIndex], octave, cents }
}

export function parseChordProgression(progression: string): string[] {
  return progression
    .split(/[\\s,]+/)
    .map(chord => chord.trim())
    .filter(chord => chord.length > 0)
}

export function formatKeyForDisplay(key: string, notation: 'english' | 'spanish' | 'german' | 'numeric'): string {
  const index = getNoteIndex(key, 'english')
  if (index === -1) return key

  const map: Record<string, string[]> = {
    english: NOTES,
    spanish: SPANISH_NOTES,
    german: GERMAN_NOTES,
    numeric: NUMERIC_NOTES,
  }

  const notes = map[notation] || NOTES
  return notes[index]
}

// ============================================================
// This Area Of Code Is: Array & Object Utilities
// Explanation: Generic helpers for sorting, grouping, filtering,
//              and manipulating arrays and objects consistently.
// In Other Words: These are "swiss army knife" functions for working
//                  with lists of data — sorting songs, grouping teams, etc.

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return direction === 'asc'
      ? (aVal as any) - (bVal as any)
      : (bVal as any) - (aVal as any)
  })
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key] ?? 'uncategorized')
    return {
      ...groups,
      [groupKey]: [...(groups[groupKey] || []), item],
    }
  }, {} as Record<string, T[]>)
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ============================================================
// This Area Of Code Is: Local Storage Helpers
// Explanation: Type-safe wrappers around browser localStorage.
//              Handles JSON serialization, expiration, and namespace isolation.
// In Other Words: These functions save small pieces of data to the browser
//                  (like user preferences) so they persist between visits.

const STORAGE_PREFIX = 'ntcc_cma_'

export function setStorageItem<T>(key: string, value: T, ttlMinutes?: number): void {
  const item = {
    value,
    timestamp: Date.now(),
    expires: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null,
  }
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(item))
}

export function getStorageItem<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return defaultValue

    const item = JSON.parse(raw)
    if (item.expires && Date.now() > item.expires) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      return defaultValue
    }

    return item.value as T
  } catch {
    return defaultValue
  }
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
}

export function clearStorage(): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key))
}

// ============================================================
// This Area Of Code Is: Device & Environment Detection
// Explanation: Detect iPad, mobile, offline status, and browser capabilities.
//              Used for responsive UI decisions and feature gating.
// In Other Words: These functions figure out what device the user is on
//                  (iPad, phone, desktop) and what features are available.

export function isIPad(): boolean {
  return /iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function supportsWebRTC(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export function supportsNotifications(): boolean {
  return 'Notification' in window
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) return Promise.resolve('denied')
  return Notification.requestPermission()
}

// ============================================================
// This Area Of Code Is: File & Blob Utilities
// Explanation: Helpers for file validation, blob conversion, and download generation.
//              Used for sheet music uploads, audio exports, and report downloads.
// In Other Words: These functions handle file operations — checking sizes,
//                  creating download links, and converting data formats.

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string, contentType: string = ''): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType })
}

export function downloadFile(data: Blob | string, filename: string, contentType?: string): void {
  const blob = typeof data === 'string' 
    ? new Blob([data], { type: contentType || 'text/plain' })
    : data

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================
// This Area Of Code Is: Random & ID Generation
// Explanation: Secure ID generation for database records, file names,
//              and temporary tokens. Uses crypto.randomUUID when available.
// In Other Words: These create unique IDs for songs, users, and files
//                  so nothing ever gets mixed up.

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function generateTempToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// ============================================================
// This Area Of Code Is: Color & Theme Utilities
// Explanation: Color manipulation for dynamic theming, contrast checking,
//              and worship-appropriate palette generation.
// In Other Words: These functions handle colors — making sure text is readable
//                  against backgrounds and creating worship-themed color schemes.

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function getContrastColor(hexColor: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return '#000000'

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)))

  return rgbToHex(r, g, b)
}

export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.round(rgb.r * (1 - percent / 100))
  const g = Math.round(rgb.g * (1 - percent / 100))
  const b = Math.round(rgb.b * (1 - percent / 100))

  return rgbToHex(r, g, b)
}

// ============================================================
// END OF FILE: src/lib/utils.ts
// Total Functions: 50+ utilities across 8 categories
// ============================================================
