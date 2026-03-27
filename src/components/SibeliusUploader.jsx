/*
This Area Of Code Is: Sibelius File Uploader Component
Explanation: This component allows users to upload Sibelius (.sib) files and convert them to MusicXML format.
             It handles file selection via click or drag-and-drop, validates the file type, sends it to the
             backend converter API, and downloads the converted MusicXML file.
In Other Words: This is the file picker that lets you upload sheet music files and turn them into a format
                the app can read and display.
*/

import React, { useState, useRef } from 'react';
import { Upload, FileMusic, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/*
This Area Of Code Is: API Configuration
Explanation: Get the backend converter URL from environment variables, or fall back to localhost for development.
             The .env.local file sets VITE_CONVERTER_API_URL=https://ntcc-music-converter.onrender.com
In Other Words: This tells the app where to send the files for conversion - uses the live server or your computer.
*/
const API_URL = import.meta.env.VITE_CONVERTER_API_URL || 'http://localhost:8000';

/*
This Area Of Code Is: Main Component Function
Explanation: This is the main function that creates the file uploader. It manages state for:
             - file: the selected file object
             - converting: whether conversion is in progress
             - error: any error messages
             - success: whether conversion completed successfully
             - fileInputRef: reference to the hidden file input element
In Other Words: This sets up all the tracking needed to know what's happening with the file upload.
*/
const SibeliusUploader = ({ onConversionComplete }) => {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  /*
  This Area Of Code Is: File Selection Handler
  Explanation: When user selects a file through the file picker, this function runs.
               It checks if the file ends with .sib (case-insensitive) and sets it as the selected file.
               If not a .sib file, shows an error message.
               CRITICAL FIX: Removed accept=".sib" from input - iOS doesn't recognize it!
               Now we accept ALL files and validate by extension in JavaScript.
  In Other Words: When you pick a file, this checks if it's really a Sibelius file and gets it ready.
  */
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validate file exists and has .sib extension (case-insensitive)
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.sib')) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    } else if (selectedFile) {
      setError('Please select a valid .sib file (Sibelius score file)');
      setFile(null);
      setSuccess(false);
    }
  };

  /*
  This Area Of Code Is: File Conversion Handler
  Explanation: Sends the selected .sib file to the backend converter API.
               Creates a FormData object (like a digital envelope) with the file,
               POSTs it to /convert/sib-to-musicxml endpoint, waits for response,
               then creates a download link for the converted MusicXML file.
               Handles errors like network issues, conversion failures, timeouts.
  In Other Words: This sends your file to the converter and downloads the result when done.
  */
  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setConverting(true);
    setError('');
    setSuccess(false);

    try {
      // Create FormData - this packages the file for sending over the internet
      const formData = new FormData();
      formData.append('file', file);

      // Send to backend converter API
      const response = await fetch(`${API_URL}/convert/sib-to-musicxml`, {
        method: 'POST',
        body: formData,
      });

      // Check if conversion failed on server side
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Conversion failed on server');
      }

      // Get the converted file as a blob (binary data)
      const blob = await response.blob();
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.replace('.sib', '.musicxml');
      document.body.appendChild(link);
      link.click(); // Trigger download
      document.body.removeChild(link); // Cleanup
      window.URL.revokeObjectURL(url); // Free memory

      setSuccess(true);
      
      // Notify parent component if callback provided
      if (onConversionComplete) {
        onConversionComplete({
          originalName: file.name,
          convertedName: file.name.replace('.sib', '.musicxml'),
        });
      }

    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert file. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  /*
  This Area Of Code Is: Drag and Drop Handler
  Explanation: When user drags a file over the drop zone and releases it,
               this function prevents the browser from opening the file,
               checks if it's a .sib file, and sets it as selected.
  In Other Words: This lets you drag a file from your computer directly into the app.
  */
  const handleDrop = (e) => {
    e.preventDefault(); // Stop browser from opening the file
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.sib')) {
      setFile(droppedFile);
      setError('');
      setSuccess(false);
    } else if (droppedFile) {
      setError('Please drop a valid .sib file (Sibelius score file)');
    }
  };

  /*
  This Area Of Code Is: Component Render (JSX)
  Explanation: This draws the uploader UI on screen. Key parts:
               - Drop zone area that accepts clicks and drag-drop
               - Hidden file input that accepts ALL file types (fix for iOS!)
               - File info display when selected
               - Error/success message boxes
               - Convert button with loading state
  In Other Words: This is what you see on screen - the box, buttons, and messages.
  */
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header with icon */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileMusic className="w-5 h-5" />
        Import Sibelius File
      </h3>

      {/* 
        Drop Zone / Click Area
        CRITICAL FIX: The hidden input below accepts ALL files (*/*) instead of just .sib
        This fixes iOS where .sib files appear grayed out
      */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {/* 
          HIDDEN FILE INPUT - THE FIX IS HERE!
          accept="*/*" means accept ALL files (iOS compatible)
          We validate the extension in handleFileSelect instead
        */}
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"  // ✅ FIXED: Was accept=".sib" - iOS doesn't support this!
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Show file info if selected, otherwise show upload prompt */}
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

      {/* Error message box */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading spinner during conversion */}
      {converting && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Converting with MuseScore...</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            File converted successfully! Check your downloads.
          </p>
        </div>
      )}

      {/* Convert button - disabled if no file or converting */}
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

/*
This Area Of Code Is: Export Statement
Explanation: Makes this component available for import in other files.
In Other Words: This lets other parts of the app use this uploader.
*/
export default SibeliusUploader;
