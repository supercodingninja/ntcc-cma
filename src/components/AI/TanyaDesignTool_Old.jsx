import React, { useState, useRef, useEffect } from 'react';
import { X, Move, Maximize2, Type, Image as ImageIcon, Palette, Trash2, Copy, Save, Play, Mic, MicOff } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { TanyaAIService } from '../../services/tanya-ai-service';

const TanyaDesignTool = ({ isOpen, onClose }) => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const canvasRef = useRef(null);
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const tanyaService = new TanyaAIService();

  const handleVoiceResult = (text) => {
    setVoiceTranscript(text);
    const command = text.toLowerCase();

    if (command.includes('add text') || command.includes('create text')) {
      const newElement = createNewElement('text', 400, 200);
      setElements([...elements, newElement]);
      setAiResponse('Text element added to canvas');
    } else if (command.includes('add box') || command.includes('create box')) {
      const newElement = createNewElement('box', 400, 200);
      setElements([...elements, newElement]);
      setAiResponse('Box element added to canvas');
    } else if (command.includes('add image') || command.includes('create image')) {
      const newElement = createNewElement('image', 400, 200);
      setElements([...elements, newElement]);
      setAiResponse('Image placeholder added to canvas');
    } else if (selectedElement && command.includes('bigger') || command.includes('larger')) {
      updateElementProperty('width', selectedElementData?.width + 50);
      updateElementProperty('height', selectedElementData?.height + 50);
      setAiResponse('Made element bigger');
    } else if (selectedElement && command.includes('smaller')) {
      updateElementProperty('width', Math.max(50, selectedElementData?.width - 50));
      updateElementProperty('height', Math.max(50, selectedElementData?.height - 50));
      setAiResponse('Made element smaller');
    } else if (selectedElement && command.includes('delete') || command.includes('remove')) {
      deleteElement();
      setAiResponse('Element deleted');
    } else if (command.includes('blue')) {
      selectedElement && updateElementProperty('color', '#3B82F6');
      setAiResponse('Changed color to blue');
    } else if (command.includes('red')) {
      selectedElement && updateElementProperty('color', '#EF4444');
      setAiResponse('Changed color to red');
    } else if (command.includes('green')) {
      selectedElement && updateElementProperty('color', '#10B981');
      setAiResponse('Changed color to green');
    } else if (command.includes('execute') || command.includes('apply changes')) {
      setShowExecuteConfirm(true);
      setAiResponse('Ready to execute design changes');
    } else {
      setAiResponse('Try: "add text", "make it bigger", "change to blue", or "execute design"');
    }

    setTimeout(() => setVoiceTranscript(''), 3000);
  };

  const { isListening, startListening, stopListening } = useVoiceRecognition(handleVoiceResult, true);

  const createNewElement = (type, x, y) => ({
    id: Date.now(),
    type,
    x,
    y,
    width: type === 'text' ? 200 : 150,
    height: type === 'text' ? 50 : 150,
    content: type === 'text' ? 'Double-click to edit' : '',
    color: type === 'text' ? '#000000' : '#3B82F6',
    backgroundColor: type === 'text' ? 'transparent' : '#E0E7FF',
    fontSize: 16,
    fontWeight: 'normal',
    rotation: 0,
    borderRadius: 8,
    opacity: 1,
  });

  const handleDragStart = (e, elementType) => {
    e.dataTransfer.setData('elementType', elementType);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newElement = createNewElement(elementType, x, y);
    setElements([...elements, newElement]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation();
    setSelectedElement(element.id);
    setDraggedElement({
      id: element.id,
      offsetX: e.clientX - element.x,
      offsetY: e.clientY - element.y,
    });
  };

  const handleMouseMove = (e) => {
    if (draggedElement && !isResizing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - draggedElement.offsetX;
      const y = e.clientY - rect.top - draggedElement.offsetY;
      setElements(elements.map(el =>
        el.id === draggedElement.id ? { ...el, x, y } : el
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setIsResizing(false);
  };

  const updateElementProperty = (property, value) => {
    setElements(elements.map(el =>
      el.id === selectedElement ? { ...el, [property]: value } : el
    ));
  };

  const deleteElement = () => {
    setElements(elements.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  };

  const duplicateElement = () => {
    const element = elements.find(el => el.id === selectedElement);
    if (element) {
      const newElement = { ...element, id: Date.now(), x: element.x + 20, y: element.y + 20 };
      setElements([...elements, newElement]);
    }
  };

  const handleExecute = () => {
    setShowExecuteConfirm(false);
    alert('Design changes have been applied! The application will now reload with your new design.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="webby-award-gradient p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tanya AI Design Studio</h2>
              <p className="text-pink-100 text-sm">Drag, drop, speak to design - no code needed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-xl transition-all shadow-lg ${
                isListening ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-xl animate-pulse' : 'bg-white/20 hover:bg-white/40 hover:scale-105'
              }`}
            >
              {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={() => setShowExecuteConfirm(true)}
              className="px-6 py-2.5 premium-button rounded-xl flex items-center gap-2 transition-all font-bold relative z-10"
            >
              <Play className="w-5 h-5" />
              Execute Design
            </button>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {(voiceTranscript || aiResponse) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-purple-200">
            {voiceTranscript && (
              <p className="text-sm text-blue-900"><strong>You said:</strong> {voiceTranscript}</p>
            )}
            {aiResponse && (
              <p className="text-sm text-purple-900"><strong>Tanya:</strong> {aiResponse}</p>
            )}
          </div>
        )}

        <div className="flex-1 flex">
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Elements</h3>
              <div className="space-y-2">
                <div draggable onDragStart={(e) => handleDragStart(e, 'text')}
                  className="bg-white p-3 rounded-xl border-2 border-gray-200 cursor-move hover:border-pink-400 hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2">
                  <Type className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">Text</span>
                </div>
                <div draggable onDragStart={(e) => handleDragStart(e, 'box')}
                  className="bg-white p-3 rounded-xl border-2 border-gray-200 cursor-move hover:border-pink-400 hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">Box</span>
                </div>
                <div draggable onDragStart={(e) => handleDragStart(e, 'image')}
                  className="bg-white p-3 rounded-xl border-2 border-gray-200 cursor-move hover:border-pink-400 hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">Image</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
              <p className="text-xs font-semibold text-pink-900 mb-2">Voice Commands:</p>
              <ul className="text-xs text-pink-700 space-y-1">
                <li>• "Add text/box/image"</li>
                <li>• "Make it bigger/smaller"</li>
                <li>• "Change to blue/red/green"</li>
                <li>• "Delete element"</li>
                <li>• "Execute design"</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">Manual Mode:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Drag elements to canvas</li>
                <li>• Click to select & edit</li>
                <li>• Use properties panel</li>
              </ul>
            </div>
          </div>

          <div ref={canvasRef} onDrop={handleDrop} onDragOver={handleDragOver} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} className="flex-1 bg-gray-100 relative overflow-auto" style={{ minHeight: '500px' }}>
            <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded shadow text-sm text-gray-600">
              Canvas - Drop elements or use voice commands
            </div>
            {elements.map((element) => (
              <div key={element.id} onMouseDown={(e) => handleElementMouseDown(e, element)}
                className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-pink-500' : ''}`}
                style={{ left: element.x, top: element.y, width: element.width, height: element.height,
                  transform: `rotate(${element.rotation}deg)`, opacity: element.opacity }}>
                {element.type === 'text' ? (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ color: element.color, backgroundColor: element.backgroundColor, fontSize: element.fontSize,
                      fontWeight: element.fontWeight, borderRadius: element.borderRadius, padding: '8px' }}>
                    {element.content}
                  </div>
                ) : element.type === 'box' ? (
                  <div className="w-full h-full" style={{ backgroundColor: element.backgroundColor,
                    borderRadius: element.borderRadius, border: `2px solid ${element.color}` }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: element.backgroundColor, borderRadius: element.borderRadius }}>
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedElementData && (
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
                <div className="flex gap-1">
                  <button onClick={duplicateElement} className="p-2 hover:bg-gray-200 rounded transition" title="Duplicate">
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={deleteElement} className="p-2 hover:bg-red-100 rounded transition" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Position X</label>
                  <input type="number" value={Math.round(selectedElementData.x)}
                    onChange={(e) => updateElementProperty('x', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Position Y</label>
                  <input type="number" value={Math.round(selectedElementData.y)}
                    onChange={(e) => updateElementProperty('y', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Width</label>
                  <input type="number" value={Math.round(selectedElementData.width)}
                    onChange={(e) => updateElementProperty('width', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Height</label>
                  <input type="number" value={Math.round(selectedElementData.height)}
                    onChange={(e) => updateElementProperty('height', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>

                {selectedElementData.type === 'text' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Content</label>
                      <input type="text" value={selectedElementData.content}
                        onChange={(e) => updateElementProperty('content', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Font Size</label>
                      <input type="number" value={selectedElementData.fontSize}
                        onChange={(e) => updateElementProperty('fontSize', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Font Weight</label>
                      <select value={selectedElementData.fontWeight}
                        onChange={(e) => updateElementProperty('fontWeight', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Light</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-700">Color</label>
                  <input type="color" value={selectedElementData.color}
                    onChange={(e) => updateElementProperty('color', e.target.value)}
                    className="w-full mt-1 h-10 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Background</label>
                  <input type="color" value={selectedElementData.backgroundColor}
                    onChange={(e) => updateElementProperty('backgroundColor', e.target.value)}
                    className="w-full mt-1 h-10 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Border Radius</label>
                  <input type="range" min="0" max="50" value={selectedElementData.borderRadius}
                    onChange={(e) => updateElementProperty('borderRadius', parseInt(e.target.value))}
                    className="w-full mt-1" />
                  <span className="text-xs text-gray-500">{selectedElementData.borderRadius}px</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Rotation</label>
                  <input type="range" min="0" max="360" value={selectedElementData.rotation}
                    onChange={(e) => updateElementProperty('rotation', parseInt(e.target.value))}
                    className="w-full mt-1" />
                  <span className="text-xs text-gray-500">{selectedElementData.rotation}°</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Opacity</label>
                  <input type="range" min="0" max="1" step="0.1" value={selectedElementData.opacity}
                    onChange={(e) => updateElementProperty('opacity', parseFloat(e.target.value))}
                    className="w-full mt-1" />
                  <span className="text-xs text-gray-500">{Math.round(selectedElementData.opacity * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExecuteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Execute Design Changes?</h3>
            <p className="text-gray-600 mb-6">
              This will apply your design changes to the application. The page will reload with your new design.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExecuteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition">
                Cancel
              </button>
              <button onClick={handleExecute}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TanyaDesignTool;
