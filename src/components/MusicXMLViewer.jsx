import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

const MusicXMLViewer = ({ musicXmlUrl, musicXmlData }) => {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (!containerRef.current) return;

    osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      drawingParameters: 'compacttight',
      drawPartNames: false,
      drawMeasureNumbers: true,
      drawTimeSignatures: true,
    });

    loadMusicXml();

    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
    };
  }, []);

  const loadMusicXml = async () => {
    if (!osmdRef.current) return;
    setLoading(true);
    setError('');

    try {
      let xmlContent;
      if (musicXmlData) {
        xmlContent = musicXmlData;
      } else if (musicXmlUrl) {
        const response = await fetch(musicXmlUrl);
        if (!response.ok) throw new Error('Failed to load MusicXML');
        xmlContent = await response.text();
      } else {
        throw new Error('No MusicXML source provided');
      }

      await osmdRef.current.load(xmlContent);
      await osmdRef.current.render();
      setLoading(false);
    } catch (err) {
      console.error('Error loading MusicXML:', err);
      setError(err.message || 'Failed to load sheet music');
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    if (osmdRef.current) {
      const newZoom = Math.min(zoom + 0.1, 2.0);
      setZoom(newZoom);
      osmdRef.current.Zoom = newZoom;
      osmdRef.current.render();
    }
  };

  const handleZoomOut = () => {
    if (osmdRef.current) {
      const newZoom = Math.max(zoom - 0.1, 0.5);
      setZoom(newZoom);
      osmdRef.current.Zoom = newZoom;
      osmdRef.current.render();
    }
  };

  const handleReset = () => {
    setZoom(1.0);
    loadMusicXml();
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700">Sheet Music Viewer</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-2 hover:bg-gray-200 rounded-md" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 hover:bg-gray-200 rounded-md" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-2 hover:bg-gray-200 rounded-md ml-2" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[500px] p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Loading sheet music...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center p-4">
              <p className="text-red-600 mb-2">{error}</p>
              <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Try Again
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
};

export default MusicXMLViewer;
