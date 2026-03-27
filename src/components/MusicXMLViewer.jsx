/*
This Area Of Code Is: MusicXML Sheet Music Viewer Component
Explanation: This component displays sheet music using the OpenSheetMusicDisplay library.
             It can load MusicXML from a URL or from raw XML data, render it as sheet music,
             and provides zoom controls for viewing.
In Other Words: This shows the sheet music on screen so you can read and practice it.
*/

import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle } from 'lucide-react';

/*
This Area Of Code Is: Main Component Function
Explanation: Creates the sheet music viewer. Props:
             - musicXmlUrl: URL to load MusicXML from (optional)
             - musicXmlData: Raw MusicXML string data (optional)
             Either url OR data must be provided.
In Other Words: This sets up the music display with zoom buttons and loading states.
*/
const MusicXMLViewer = ({ musicXmlUrl, musicXmlData }) => {
  const containerRef = useRef(null);      // Reference to the div where music renders
  const osmdRef = useRef(null);           // Reference to the OpenSheetMusicDisplay instance
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1.0);  // Zoom level (1.0 = 100%)

  /*
  This Area Of Code Is: Component Mount Effect
  Explanation: Runs once when component loads. Creates the OpenSheetMusicDisplay instance
               with settings for auto-resizing, compact display, and visible measure numbers.
               Then loads the MusicXML data.
               Cleanup function clears the display when component unmounts.
  In Other Words: This starts up the music viewer when you open a song.
  */
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the sheet music display with settings
    osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,                    // Adjust size when window resizes
      drawingParameters: 'compacttight',   // Compact layout
      drawPartNames: false,                // Hide instrument names
      drawMeasureNumbers: true,            // Show measure numbers
      drawTimeSignatures: true,            // Show time signatures
    });

    loadMusicXml();

    // Cleanup: clear display when leaving
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
    };
  }, []);

  /*
  This Area Of Code Is: MusicXML Load Function
  Explanation: Loads MusicXML data either from a URL (fetch) or from provided string data.
               Then tells OpenSheetMusicDisplay to parse and render it.
               Handles errors like network failures, invalid XML, missing data.
  In Other Words: This gets the music data and draws it on screen.
  */
  const loadMusicXml = async () => {
    if (!osmdRef.current) return;
    setLoading(true);
    setError('');

    try {
      let xmlContent;

      // Get XML from data prop or fetch from URL
      if (musicXmlData) {
        xmlContent = musicXmlData;
      } else if (musicXmlUrl) {
        const response = await fetch(musicXmlUrl);
        if (!response.ok) throw new Error('Failed to load MusicXML from server');
        xmlContent = await response.text();
      } else {
        throw new Error('No MusicXML source provided (need url or data prop)');
      }

      // Load and render the sheet music
      await osmdRef.current.load(xmlContent);
      await osmdRef.current.render();
      setLoading(false);
    } catch (err) {
      console.error('Error loading MusicXML:', err);
      setError(err.message || 'Failed to load sheet music. The file may be corrupted.');
      setLoading(false);
    }
  };

  /*
  This Area Of Code Is: Zoom In Handler
  Explanation: Increases zoom level by 10%, up to maximum 200%.
               Updates the display and re-renders the sheet music.
  In Other Words: Makes the sheet music bigger so you can see it better.
  */
  const handleZoomIn = () => {
    if (osmdRef.current) {
      const newZoom = Math.min(zoom + 0.1, 2.0);
      setZoom(newZoom);
      osmdRef.current.Zoom = newZoom;
      osmdRef.current.render();
    }
  };

  /*
  This Area Of Code Is: Zoom Out Handler
  Explanation: Decreases zoom level by 10%, down to minimum 50%.
               Updates the display and re-renders the sheet music.
  In Other Words: Makes the sheet music smaller to see more at once.
  */
  const handleZoomOut = () => {
    if (osmdRef.current) {
      const newZoom = Math.max(zoom - 0.1, 0.5);
      setZoom(newZoom);
      osmdRef.current.Zoom = newZoom;
      osmdRef.current.render();
    }
  };

  /*
  This Area Of Code Is: Reset Handler
  Explanation: Resets zoom to 100% and reloads the MusicXML from source.
  In Other Words: Goes back to normal size and refreshes the music.
  */
  const handleReset = () => {
    setZoom(1.0);
    loadMusicXml();
  };

  /*
  This Area Of Code Is: Component Render (JSX)
  Explanation: Renders the viewer UI with:
               - Header with title and zoom controls
               - Loading spinner while loading
               - Error message with retry button if failed
               - Sheet music display area
  In Other Words: This draws the music viewer with all the buttons.
  */
  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with zoom controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700">Sheet Music Viewer</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleZoomOut} 
            className="p-2 hover:bg-gray-200 rounded-md transition-colors" 
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn} 
            className="p-2 hover:bg-gray-200 rounded-md transition-colors" 
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={handleReset} 
            className="p-2 hover:bg-gray-200 rounded-md ml-2 transition-colors" 
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Music display area */}
      <div className="relative min-h-[500px] p-4">
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Loading sheet music...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center p-4 max-w-md">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={handleReset} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Sheet music renders here */}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
};

export default MusicXMLViewer;
