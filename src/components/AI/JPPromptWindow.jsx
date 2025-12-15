import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { JPAIService } from '../../services/jp-ai-service';
import { useAuth } from '../../contexts/AuthContext';

const JPPromptWindow = ({ isOpen, onClose }) => {
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [response, setResponse] = useState('');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const jpService = new JPAIService();

  const handleVoiceResult = async (text) => {
    setTranscript(text);
    await processCommand(text);
  };

  const processCommand = async (text) => {
    try {
      setError('');
      const result = await jpService.processCommand(text, user?.id);
      setResponse(result.message);

      if (result.tasks) {
        setTasks(result.tasks);
      }

      if (result.action === 'close') {
        setTimeout(onClose, 1000);
      }
    } catch (error) {
      setError('Sorry, I encountered an error processing your request.');
      console.error('JP AI Error:', error);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      setTranscript(textInput);
      processCommand(textInput);
      setTextInput('');
    }
  };

  const { isListening, startListening, stopListening } = useVoiceRecognition(handleVoiceResult, true);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="webby-award-gradient p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              JP - Task Management AI
            </h2>
            <p className="text-blue-100 mt-1">Say "assign task" or "check status"</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-5 rounded-full transition-all shadow-xl ${
                isListening
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-2xl animate-pulse'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-2xl hover:scale-110'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-white" />
              )}
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isListening ? 'Listening...' : 'Click mic to start'}
              </p>
            </div>
          </div>

          {transcript && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                You said:
              </p>
              <p className="text-gray-700 dark:text-gray-300">{transcript}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Error:
              </p>
              <p className="text-gray-700 dark:text-gray-300">{error}</p>
            </div>
          )}

          {response && !error && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                JP says:
              </p>
              <p className="text-gray-700 dark:text-gray-300">{response}</p>
            </div>
          )}

          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a command... (e.g., 'check status')"
              className="flex-1 px-4 py-3 premium-input rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-3 premium-button rounded-xl font-bold transition-all relative z-10"
            >
              Send
            </button>
          </form>

          {tasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Tasks:</h3>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.assigned_user?.full_name}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {task.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JPPromptWindow;
