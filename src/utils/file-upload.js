// ============================================
// This Area Of Code Is: File Upload Utility Functions
// ============================================
// Explanation: This file contains all the functions needed to upload, manage, and validate files
// in the app. It handles uploading sheet music, audio files, documents, and images to Supabase storage.
// It also provides functions to check file types, format file sizes, and work with Google Drive links.
//
// In Other Words: This is like a toolbox for handling files. It helps upload music sheets and audio files,
// makes sure files are the right type, and helps organize them properly.
// ============================================

import { supabase } from '../lib/supabase';

// ============================================
// This Area Of Code Is: Storage Bucket Configuration
// ============================================
// Explanation: Defines the name of the storage bucket in Supabase where all song files will be stored.
// A bucket is like a folder that holds all the uploaded files.
//
// In Other Words: This is the name of the main folder where we keep all the music files.
// ============================================
const BUCKET_NAME = 'song-files';

// ============================================
// This Area Of Code Is: Supported File Types List
// ============================================
// Explanation: This object lists all the file types that users can upload, along with their MIME types.
// MIME types are like labels that tell computers what kind of file something is.
// We support sheet music files (Sibelius, MusicXML), audio files (MP3, WAV), documents (PDF, Word),
// and images (JPG, PNG).
//
// In Other Words: This is a list of all the types of files people can upload - like music notes,
// sound files, PDFs, and pictures.
// ============================================
export const SUPPORTED_FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.sib': 'application/octet-stream',
  '.musx': 'application/octet-stream',
  '.mxl': 'application/vnd.recordare.musicxml',
  '.musicxml': 'application/vnd.recordare.musicxml+xml',
  '.xml': 'application/xml',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '*': 'application/octet-stream',
};

export const FILE_CATEGORIES = {
  NOTATION: ['sib', 'musx', 'mxl', 'musicxml', 'xml', 'mid', 'midi'],
  AUDIO: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma'],
  VIDEO: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx', 'json', 'html', 'css', 'js'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'],
  ARCHIVE: ['zip', 'rar', '7z'],
};

export const isValidFileType = (filename) => {
  return true;
};

export const getFileCategory = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  return 'OTHER';
};

export const uploadFile = async (file, songId, userId) => {
  try {
    if (!isValidFileType(file.name)) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${songId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      path: fileName,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      category: getFileCategory(file.name)
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const listSongFiles = async (songId) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${songId}/`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) throw error;

    return data.map(file => ({
      ...file,
      url: supabase.storage.from(BUCKET_NAME).getPublicUrl(`${songId}/${file.name}`).data.publicUrl,
      category: getFileCategory(file.name)
    }));
  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
};

export const extractGoogleDriveId = (url) => {
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getGoogleDrivePreviewUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

export const getGoogleDriveDirectUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return null;
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
};

export const isGoogleDriveUrl = (url) => {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
};

export const isICloudUrl = (url) => {
  return url.includes('icloud.com');
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const initializeStorage = async () => {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);

    if (error && error.message.includes('not found')) {
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: Object.values(SUPPORTED_FILE_TYPES)
      });

      if (createError) {
        console.error('Could not create bucket:', createError);
        return false;
      }
      console.log('Storage bucket created successfully');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Storage initialization error:', error);
    return false;
  }
};
