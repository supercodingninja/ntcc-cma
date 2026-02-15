/* feat(components): add Sibelius file uploader with drag-and-drop support */
import React, { useState, useRef } from 'react';
import { Upload, FileMusic, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_CONVERTER_API_URL || 'http://localhost:8000';

const SibeliusUploader = ({ onConversionComplete }) => {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.sib')) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    } else {
      setError('Please select a valid .sib file');
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setConverting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/convert/sib-to-musicxml`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.replace('.sib', '.musicxml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      
      if (onConversionComplete) {
        onConversionComplete({
          originalName: file.name,
          convertedName: file.name.replace('.sib', '.musicxml'),
        });
      }

    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert file');
    } finally {
      setConverting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.sib')) {
      setFile(droppedFile);
      setError('');
      setSuccess(false);
    } else {
      setError('Please drop a valid .sib file');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileMusic className="w-5 h-5" />
        Import Sibelius File
      </h3>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".sib"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">Drop .sib file here or click to browse</p>
            <p className="text-xs text-gray-400">Supports Sibelius files (.sib)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {converting && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Converting...</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            File converted successfully!
          </p>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!file || converting}
        className={`mt-4 w-full py-2 px-4 rounded-md font-medium transition-colors ${
          !file || converting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {converting ? 'Converting...' : 'Convert to MusicXML'}
      </button>
    </div>
  );
};

export default SibeliusUploader;
