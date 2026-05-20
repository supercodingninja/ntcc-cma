// ============================================================
// FILE: src/lib/supabase.ts
// NTCC Music App — Supabase Client & Database Operations
// ============================================================

// This Area Of Code Is: Supabase Client Initialization
// Explanation: Creates the single Supabase client instance used across
//              the entire app. Uses the credentials from netlify.toml.
//              The client handles auth, database queries, real-time subscriptions,
//              and storage operations. Singleton pattern ensures one connection.
// In Other Words: This is the "phone line" to the database — one connection
//                  that every part of the app uses to talk to Supabase.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'

// Supabase credentials from netlify.toml — DO NOT expose in client-side logs
const SUPABASE_URL = 'https://fozsbkbfwofycvhrmkqy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvenNia2Jmd29meWN2aHJta3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcxNDksImV4cCI6MjA3ODI5MzE0OX0.1nyd5SLS1Zef8AhWrvV1l9prXeXHdHXNTditsniwe0U'

// Create the singleton Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// ============================================================
// This Area Of Code Is: Authentication Helpers
// Explanation: Wrapper functions for Supabase Auth operations.
//              These provide type-safe auth with consistent error handling.
//              All auth flows (login, signup, logout, password reset) go through here.
// In Other Words: These are the "security guards" — they handle who gets in,
//                  who signs up, who resets passwords, and who gets kicked out.

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  return { data, error }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// ============================================================
// This Area Of Code Is: Database Query Builders
// Explanation: Reusable query builders for common database operations.
//              These wrap Supabase's query API with type safety and
//              consistent patterns for CRUD across all tables.
// In Other Words: These are the "shortcuts" for talking to the database —
//                  instead of writing long queries every time, use these helpers.

export async function fetchFromTable<T>(
  table: string,
  options?: {
    select?: string
    eq?: Record<string, string | number | boolean>
    order?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
    search?: { column: string; query: string }
  }
) {
  let query = supabase.from(table).select(options?.select || '*')

  if (options?.eq) {
    Object.entries(options.eq).forEach(([column, value]) => {
      query = query.eq(column, value)
    })
  }

  if (options?.search) {
    query = query.ilike(options.search.column, `%${options.search.query}%`)
  }

  if (options?.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query
  return { data: data as T[] | null, error, count }
}

export async function insertIntoTable<T>(table: string, data: Partial<T>) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()
  return { data: result as T | null, error }
}

export async function updateTable<T>(
  table: string,
  id: string,
  data: Partial<T>
) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return { data: result as T | null, error }
}

export async function deleteFromTable(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  return { error }
}

// ============================================================
// This Area Of Code Is: Real-Time Subscriptions
// Explanation: Live database change listeners using Supabase Realtime.
//              These enable instant UI updates when data changes —
//              no page refresh needed. Used for live collaboration features.
// In Other Words: This is the "live wire" — when someone else changes data,
//                  everyone else's screen updates automatically.

export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event, schema: 'public', table },
      callback
    )
    .subscribe()

  return channel
}

export function subscribeToRow(
  table: string,
  id: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  const channel = supabase
    .channel(`${table}_${id}`)
    .on(
      'postgres_changes',
      { event, schema: 'public', table, filter: `id=eq.${id}` },
      callback
    )
    .subscribe()

  return channel
}

// ============================================================
// This Area Of Code Is: Supabase Storage Operations
// Explanation: File upload, download, and management using Supabase Storage.
//              Handles videos, audio, sheet music, images, and documents.
//              Buckets: practice-videos, service-videos, tutorial-videos, background-videos.
// In Other Words: This is the "file cabinet" — where all uploaded videos,
//                  audio files, sheet music, and documents live in the cloud.

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    upsert?: boolean
    contentType?: string
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType,
    })
  return { data, error }
}

export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  return { signedUrl: data?.signedUrl, error }
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}

export async function listFiles(bucket: string, path?: string) {
  const { data, error } = await supabase.storage.from(bucket).list(path || '')
  return { data, error }
}

// ============================================================
// This Area Of Code Is: Storage Bucket Configuration
// Explanation: Predefined bucket names and max file sizes for the app.
//              Supabase free tier: 100MB max per file.
//              RLS policies protect private buckets.
// In Other Words: These are the "folders" in the cloud where different
//                  types of files go — videos in one, music in another, etc.

export const STORAGE_BUCKETS = {
  PRACTICE_VIDEOS: 'practice-videos',
  SERVICE_VIDEOS: 'service-videos',
  TUTORIAL_VIDEOS: 'tutorial-videos',
  BACKGROUND_VIDEOS: 'background-videos',
  SHEET_MUSIC: 'sheet-music',
  AUDIO_TRACKS: 'audio-tracks',
  RESOURCES: 'resources',
  AVATARS: 'avatars',
} as const

export const MAX_FILE_SIZE_MB = 100
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ============================================================
// This Area Of Code Is: RPC (Remote Procedure Calls)
// Explanation: Direct SQL function calls for complex operations
//              that can't be done with simple CRUD — like aggregations,
//              custom searches, or multi-table joins.
// In Other Words: These are "special commands" for complex database tasks
//                  that need custom SQL logic.

export async function rpc<T>(functionName: string, params?: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(functionName, params)
  return { data: data as T | null, error }
}

// ============================================================
// This Area Of Code Is: Error Handling Utilities
// Explanation: Standardized error parsing and user-friendly messages
//              for all Supabase errors. Converts technical error codes
//              into readable messages for toast notifications.
// In Other Words: When something goes wrong with the database,
//                  these turn confusing error codes into human-friendly messages.

export function parseSupabaseError(error: any): { message: string; code: string } {
  const errorMap: Record<string, string> = {
    '23505': 'A record with this information already exists.',
    '23503': 'This action references a record that does not exist.',
    '42501': 'You do not have permission to perform this action.',
    'PGRST116': 'The requested resource was not found.',
    'PGRST301': 'Invalid query parameters provided.',
    'auth/invalid_credentials': 'Invalid email or password. Please try again.',
    'auth/user_not_found': 'No account found with this email.',
    'auth/email_taken': 'An account with this email already exists.',
    'auth/weak_password': 'Password must be at least 8 characters with letters and numbers.',
    'storage/unauthorized': 'You do not have permission to access this file.',
    'storage/not_found': 'The requested file was not found.',
    'storage/unknown_error': 'An error occurred while processing the file.',
  }

  const code = error?.code || 'unknown'
  const message = errorMap[code] || error?.message || 'An unexpected error occurred. Please try again.'

  return { message, code }
}

// ============================================================
// This Area Of Code Is: Health Check & Keep-Alive
// Explanation: Simple ping function to verify Supabase connection.
//              Used by the keep-alive GitHub Action and for
//              connection status indicators in the UI.
// In Other Words: This is the "heartbeat" — a quick check to make sure
//                  the database is still awake and responding.

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('ntcc_songs').select('id', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}

// ============================================================
// END OF FILE: src/lib/supabase.ts
// Total Exports: 20+ functions, 8 storage buckets, error parser, health check
// ============================================================
