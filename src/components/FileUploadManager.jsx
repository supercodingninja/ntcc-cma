import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, X, File, Music, FileText, Image as ImageIcon, Trash2, ExternalLink, FileAudio, FileCode } from 'lucide-react';
import { uploadFile, isGoogleDriveUrl, isICloudUrl, getGoogleDrivePreviewUrl, formatFileSize } from '../utils/file-upload';
import { supabase } from '../lib/supabase';

const FileUploadManager = ({ songId, onFilesChange }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (songId) {
      fetchFiles();
    }
  }, [songId]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('song_attachments')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'NOTATION': return <Music className="w-5 h-5 text-blue-600" />;
      case 'AUDIO': return <FileAudio className="w-5 h-5 text-purple-600" />;
      case 'DOCUMENT': return <FileText className="w-5 h-5 text-green-600" />;
      case 'IMAGE': return <ImageIcon className="w-5 h-5 text-pink-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processFiles = async (selectedFiles) => {
    setError('');
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const file of selectedFiles) {
        const uploadedFile = await uploadFile(file, songId, user.id);

        const { data, error: dbError } = await supabase
          .from('song_attachments')
          .insert({
            song_id: songId,
            file_name: uploadedFile.name,
            file_path: uploadedFile.path,
            file_url: uploadedFile.url,
            file_size: uploadedFile.size,
            file_type: uploadedFile.type,
            file_category: uploadedFile.category,
            uploaded_by: user.id,
            upload_type: 'direct_upload'
          })
          .select()
          .single();

        if (dbError) throw dbError;
        setFiles(prev => [...prev, data]);
      }

      if (onFilesChange) onFilesChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExternalLink = async () => {
    if (!externalUrl.trim()) return;

    setError('');
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let provider = 'web_link';
      let processedUrl = externalUrl;

      if (isGoogleDriveUrl(externalUrl)) {
        provider = 'google_drive';
        processedUrl = getGoogleDrivePreviewUrl(externalUrl) || externalUrl;
      } else if (isICloudUrl(externalUrl)) {
        provider = 'icloud';
      }

      const fileName = externalUrl.split('/').pop() || 'External Link';

      const { data, error: dbError } = await supabase
        .from('song_attachments')
        .insert({
          song_id: songId,
          file_name: fileName,
          external_url: processedUrl,
          external_provider: provider,
          uploaded_by: user.id,
          upload_type: provider,
          file_category: 'DOCUMENT'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles(prev => [...prev, data]);
      setExternalUrl('');
      setShowLinkInput(false);
      if (onFilesChange) onFilesChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, filePath) => {
    if (!confirm('Delete this file?')) return;

    try {
      const { error: dbError } = await supabase
        .from('song_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      if (filePath) {
        await supabase.storage.from('song-files').remove([filePath]);
      }

      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (onFilesChange) onFilesChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const supportedFormats = [
    { ext: 'SIB', name: 'Sibelius', color: 'from-blue-500 to-blue-600' },
    { ext: 'PDF', name: 'PDF', color: 'from-red-500 to-red-600' },
    { ext: 'MP3', name: 'Audio', color: 'from-purple-500 to-purple-600' },
    { ext: 'MP4', name: 'Video', color: 'from-green-500 to-green-600' },
    { ext: 'IMG', name: 'Images', color: 'from-pink-500 to-pink-600' },
    { ext: 'ALL', name: 'Any File', color: 'from-gray-500 to-gray-600' }
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="glass-panel p-6">
        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Upload Music Files
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Upload any file type - music, audio, video, documents, images, and more. Or add links from Google Drive/iCloud.
        </p>

        <div
          className={`file-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input').click()}
        >
          <div className="upload-icon-container">
            <Upload />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop your music files or click to select
          </p>
          <div className="supported-formats">
            {supportedFormats.map((format) => (
              <span key={format.ext} className="format-badge">
                {format.ext}
              </span>
            ))}
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="flex-1 premium-button py-3 px-6 rounded-xl flex items-center justify-center gap-2 relative z-10"
          >
            <LinkIcon className="w-5 h-5" />
            Add External Link
          </button>
        </div>

        {showLinkInput && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl animate-scale-in">
            <div className="flex gap-2">
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="Paste Google Drive, iCloud, or any web link"
                className="flex-1 px-4 py-3 premium-input rounded-xl focus:outline-none"
              />
              <button
                onClick={handleExternalLink}
                disabled={!externalUrl.trim() || uploading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowLinkInput(false);
                  setExternalUrl('');
                }}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 font-medium animate-scale-in">
            {error}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="glass-panel p-6 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" />
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all hover:shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    {getCategoryIcon(file.file_category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {file.file_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                      {file.file_size && <span className="font-medium">{formatFileSize(file.file_size)}</span>}
                      {file.external_provider && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {file.external_provider.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(file.file_url || file.external_url) && (
                    <a
                      href={file.file_url || file.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 hover:bg-blue-100 rounded-lg transition-all"
                      title="Open file"
                    >
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(file.id, file.file_path)}
                    className="p-3 hover:bg-red-100 rounded-lg transition-all"
                    title="Delete file"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadManager;
