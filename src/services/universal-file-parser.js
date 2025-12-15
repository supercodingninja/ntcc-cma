import { supabase } from '../lib/supabase';

export const FILE_TYPE_INFO = {
  pdf: {
    name: 'PDF Document',
    icon: 'FileText',
    color: 'from-red-500 to-red-600',
    category: 'document',
    viewable: true,
    description: 'Portable Document Format - can contain text, images, and sheet music'
  },
  sib: {
    name: 'Sibelius Score',
    icon: 'Music',
    color: 'from-blue-500 to-blue-600',
    category: 'notation',
    viewable: true,
    description: 'Professional music notation software file containing musical scores, parts, and playback data',
    features: ['Musical notation', 'Multiple instrument parts', 'Playback data', 'Dynamics and expressions', 'Lyrics']
  },
  musx: {
    name: 'Finale Score',
    icon: 'Music',
    color: 'from-green-500 to-green-600',
    category: 'notation',
    viewable: true,
    description: 'Finale music notation file containing musical scores and arrangements'
  },
  mxl: {
    name: 'MusicXML (Compressed)',
    icon: 'Music',
    color: 'from-teal-500 to-teal-600',
    category: 'notation',
    viewable: true,
    description: 'Universal music notation format readable by most notation software'
  },
  musicxml: {
    name: 'MusicXML',
    icon: 'Music',
    color: 'from-teal-500 to-teal-600',
    category: 'notation',
    viewable: true,
    description: 'Universal music notation exchange format'
  },
  xml: {
    name: 'XML Document',
    icon: 'FileCode',
    color: 'from-orange-500 to-orange-600',
    category: 'document',
    viewable: true,
    description: 'Extensible Markup Language file'
  },
  mid: {
    name: 'MIDI File',
    icon: 'Music2',
    color: 'from-purple-500 to-purple-600',
    category: 'audio',
    viewable: true,
    description: 'Musical Instrument Digital Interface file with note data',
    features: ['Note sequences', 'Tempo information', 'Instrument assignments', 'Control messages']
  },
  midi: {
    name: 'MIDI File',
    icon: 'Music2',
    color: 'from-purple-500 to-purple-600',
    category: 'audio',
    viewable: true,
    description: 'Musical Instrument Digital Interface file'
  },
  mp3: {
    name: 'MP3 Audio',
    icon: 'Volume2',
    color: 'from-pink-500 to-pink-600',
    category: 'audio',
    viewable: true,
    description: 'Compressed audio file playable in browser'
  },
  wav: {
    name: 'WAV Audio',
    icon: 'Volume2',
    color: 'from-indigo-500 to-indigo-600',
    category: 'audio',
    viewable: true,
    description: 'Uncompressed high-quality audio file'
  },
  m4a: {
    name: 'M4A Audio',
    icon: 'Volume2',
    color: 'from-cyan-500 to-cyan-600',
    category: 'audio',
    viewable: true,
    description: 'Apple audio format with high quality compression'
  },
  ogg: {
    name: 'OGG Audio',
    icon: 'Volume2',
    color: 'from-amber-500 to-amber-600',
    category: 'audio',
    viewable: true,
    description: 'Open source audio format'
  },
  aac: {
    name: 'AAC Audio',
    icon: 'Volume2',
    color: 'from-rose-500 to-rose-600',
    category: 'audio',
    viewable: true,
    description: 'Advanced Audio Coding format'
  },
  jpg: {
    name: 'JPEG Image',
    icon: 'Image',
    color: 'from-emerald-500 to-emerald-600',
    category: 'image',
    viewable: true,
    description: 'Compressed image format'
  },
  jpeg: {
    name: 'JPEG Image',
    icon: 'Image',
    color: 'from-emerald-500 to-emerald-600',
    category: 'image',
    viewable: true,
    description: 'Compressed image format'
  },
  png: {
    name: 'PNG Image',
    icon: 'Image',
    color: 'from-sky-500 to-sky-600',
    category: 'image',
    viewable: true,
    description: 'Lossless image format with transparency support'
  },
  gif: {
    name: 'GIF Image',
    icon: 'Image',
    color: 'from-violet-500 to-violet-600',
    category: 'image',
    viewable: true,
    description: 'Graphics format supporting animation'
  },
  webp: {
    name: 'WebP Image',
    icon: 'Image',
    color: 'from-lime-500 to-lime-600',
    category: 'image',
    viewable: true,
    description: 'Modern image format with excellent compression'
  },
  svg: {
    name: 'SVG Image',
    icon: 'Image',
    color: 'from-fuchsia-500 to-fuchsia-600',
    category: 'image',
    viewable: true,
    description: 'Scalable Vector Graphics'
  },
  doc: {
    name: 'Word Document',
    icon: 'FileText',
    color: 'from-blue-600 to-blue-700',
    category: 'document',
    viewable: true,
    description: 'Microsoft Word document'
  },
  docx: {
    name: 'Word Document',
    icon: 'FileText',
    color: 'from-blue-600 to-blue-700',
    category: 'document',
    viewable: true,
    description: 'Microsoft Word document (modern format)'
  },
  txt: {
    name: 'Text File',
    icon: 'FileText',
    color: 'from-gray-500 to-gray-600',
    category: 'document',
    viewable: true,
    description: 'Plain text file'
  },
  rtf: {
    name: 'Rich Text',
    icon: 'FileText',
    color: 'from-slate-500 to-slate-600',
    category: 'document',
    viewable: true,
    description: 'Rich Text Format document'
  },
  xlsx: {
    name: 'Excel Spreadsheet',
    icon: 'Table',
    color: 'from-green-600 to-green-700',
    category: 'document',
    viewable: true,
    description: 'Microsoft Excel spreadsheet'
  },
  xls: {
    name: 'Excel Spreadsheet',
    icon: 'Table',
    color: 'from-green-600 to-green-700',
    category: 'document',
    viewable: true,
    description: 'Microsoft Excel spreadsheet (legacy)'
  },
  pptx: {
    name: 'PowerPoint',
    icon: 'Presentation',
    color: 'from-orange-600 to-orange-700',
    category: 'document',
    viewable: false,
    description: 'Microsoft PowerPoint presentation'
  },
  csv: {
    name: 'CSV Data',
    icon: 'Table',
    color: 'from-teal-600 to-teal-700',
    category: 'document',
    viewable: true,
    description: 'Comma-separated values data file'
  },
  json: {
    name: 'JSON Data',
    icon: 'FileCode',
    color: 'from-yellow-500 to-yellow-600',
    category: 'document',
    viewable: true,
    description: 'JavaScript Object Notation data file'
  },
  zip: {
    name: 'ZIP Archive',
    icon: 'Archive',
    color: 'from-stone-500 to-stone-600',
    category: 'archive',
    viewable: false,
    description: 'Compressed file archive'
  },
  mp4: {
    name: 'MP4 Video',
    icon: 'Video',
    color: 'from-red-600 to-red-700',
    category: 'video',
    viewable: true,
    description: 'Video file playable in browser'
  },
  webm: {
    name: 'WebM Video',
    icon: 'Video',
    color: 'from-orange-600 to-orange-700',
    category: 'video',
    viewable: true,
    description: 'Web-optimized video format'
  },
  mov: {
    name: 'QuickTime Video',
    icon: 'Video',
    color: 'from-blue-600 to-blue-700',
    category: 'video',
    viewable: true,
    description: 'Apple QuickTime video file'
  }
};

export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileTypeInfo = (filename) => {
  const ext = getFileExtension(filename);
  return FILE_TYPE_INFO[ext] || {
    name: `${ext.toUpperCase()} File`,
    icon: 'File',
    color: 'from-gray-500 to-gray-600',
    category: 'other',
    viewable: false,
    description: 'Unknown file type'
  };
};

export const isViewableInBrowser = (filename) => {
  const info = getFileTypeInfo(filename);
  return info.viewable;
};

export const getFileCategory = (filename) => {
  const info = getFileTypeInfo(filename);
  return info.category;
};

export const parseSibeliusFile = async (fileUrl) => {
  return {
    type: 'sibelius',
    info: FILE_TYPE_INFO.sib,
    canPlayback: false,
    extractedData: {
      title: 'Sibelius Score',
      composer: 'Unknown',
      instruments: [],
      tempo: null,
      timeSignature: null,
      keySignature: null,
      measures: 0,
      pages: 0
    },
    recommendations: [
      'Download and open with Sibelius, Finale, or MuseScore',
      'Export to MusicXML for universal compatibility',
      'Export to PDF for easy viewing and printing'
    ]
  };
};

export const parseMusicXMLFile = async (fileContent) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, 'text/xml');

    const title = xmlDoc.querySelector('work-title')?.textContent ||
                  xmlDoc.querySelector('movement-title')?.textContent || 'Untitled';
    const composer = xmlDoc.querySelector('creator[type="composer"]')?.textContent || 'Unknown';
    const parts = xmlDoc.querySelectorAll('part-name');
    const instruments = Array.from(parts).map(p => p.textContent);

    return {
      type: 'musicxml',
      info: FILE_TYPE_INFO.musicxml,
      extractedData: {
        title,
        composer,
        instruments,
        partCount: instruments.length
      }
    };
  } catch (error) {
    console.error('Error parsing MusicXML:', error);
    return null;
  }
};

export const parseMIDIFile = async (arrayBuffer) => {
  try {
    const dataView = new DataView(arrayBuffer);
    const headerChunk = String.fromCharCode(
      dataView.getUint8(0),
      dataView.getUint8(1),
      dataView.getUint8(2),
      dataView.getUint8(3)
    );

    if (headerChunk !== 'MThd') {
      throw new Error('Invalid MIDI file');
    }

    const format = dataView.getUint16(8);
    const trackCount = dataView.getUint16(10);
    const division = dataView.getUint16(12);

    return {
      type: 'midi',
      info: FILE_TYPE_INFO.mid,
      extractedData: {
        format,
        trackCount,
        division,
        ticksPerQuarterNote: division
      }
    };
  } catch (error) {
    console.error('Error parsing MIDI:', error);
    return null;
  }
};

export const parseTextFile = async (fileContent) => {
  const lines = fileContent.split('\n');
  const wordCount = fileContent.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = fileContent.length;

  return {
    type: 'text',
    info: FILE_TYPE_INFO.txt,
    extractedData: {
      lineCount: lines.length,
      wordCount,
      charCount,
      preview: lines.slice(0, 20).join('\n')
    }
  };
};

export const parseCSVFile = async (fileContent) => {
  const lines = fileContent.split('\n').filter(l => l.trim());
  const headers = lines[0]?.split(',').map(h => h.trim()) || [];
  const rows = lines.slice(1);

  return {
    type: 'csv',
    info: FILE_TYPE_INFO.csv,
    extractedData: {
      headers,
      rowCount: rows.length,
      columnCount: headers.length,
      preview: rows.slice(0, 10).map(row => row.split(',').map(cell => cell.trim()))
    }
  };
};

export const parseJSONFile = async (fileContent) => {
  try {
    const data = JSON.parse(fileContent);
    const isArray = Array.isArray(data);

    return {
      type: 'json',
      info: FILE_TYPE_INFO.json,
      extractedData: {
        isArray,
        itemCount: isArray ? data.length : Object.keys(data).length,
        keys: isArray ? (data[0] ? Object.keys(data[0]) : []) : Object.keys(data),
        preview: JSON.stringify(data, null, 2).slice(0, 1000)
      }
    };
  } catch (error) {
    return null;
  }
};

export const parseXMLFile = async (fileContent) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
    const root = xmlDoc.documentElement;

    return {
      type: 'xml',
      info: FILE_TYPE_INFO.xml,
      extractedData: {
        rootElement: root.tagName,
        childCount: root.children.length,
        preview: fileContent.slice(0, 1000)
      }
    };
  } catch (error) {
    return null;
  }
};

export const parseUniversalFile = async (file, fileUrl) => {
  const ext = getFileExtension(file?.file_name || file?.name || '');
  const info = getFileTypeInfo(file?.file_name || file?.name || '');

  const baseResult = {
    fileName: file?.file_name || file?.name,
    fileSize: file?.file_size || file?.size,
    fileType: ext,
    info,
    fileUrl: fileUrl || file?.file_url || file?.external_url,
    canPreview: info.viewable,
    category: info.category
  };

  return baseResult;
};

export const getViewerType = (filename) => {
  const ext = getFileExtension(filename);

  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['txt', 'md', 'log'].includes(ext)) return 'text';
  if (['csv'].includes(ext)) return 'csv';
  if (['json'].includes(ext)) return 'json';
  if (['xml', 'musicxml'].includes(ext)) return 'xml';
  if (['sib'].includes(ext)) return 'sibelius';
  if (['musx'].includes(ext)) return 'finale';
  if (['mid', 'midi'].includes(ext)) return 'midi';
  if (['mxl'].includes(ext)) return 'musicxml-compressed';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';

  return 'generic';
};

export const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/octet-stream': 'binary',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/midi': 'midi',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/vnd.recordare.musicxml': 'mxl',
  'application/vnd.recordare.musicxml+xml': 'musicxml',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
};

export const ALL_SUPPORTED_EXTENSIONS = Object.keys(FILE_TYPE_INFO);
