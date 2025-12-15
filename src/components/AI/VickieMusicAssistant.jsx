import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Send, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { VickieAIService } from '../../services/vickie-ai-service';
import {
  saveConversation,
  loadConversation,
  clearConversation,
  saveModalState,
  loadModalState,
  AI_MODAL_STORAGE_KEYS
} from '../../utils/ai-modal-state';

const VickieMusicAssistant = ({ isOpen, onClose }) => {
  const defaultMessage = { type: 'assistant', text: 'Hi! I\'m Vickie, your music assistant. Ask me about music theory, instruments, counting rhythms, reading sheet music, practice tips, or how to use the app!' };

  const [messages, setMessages] = useState(() => loadConversation(AI_MODAL_STORAGE_KEYS.VICKIE, [defaultMessage]));
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => loadModalState(AI_MODAL_STORAGE_KEYS.VICKIE_STATE).isMinimized);
  const messagesEndRef = useRef(null);
  const vickieService = new VickieAIService();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    saveConversation(AI_MODAL_STORAGE_KEYS.VICKIE, messages);
  }, [messages]);

  useEffect(() => {
    saveModalState(AI_MODAL_STORAGE_KEYS.VICKIE_STATE, { isMinimized });
  }, [isMinimized]);

  const handleVoiceResult = async (text) => {
    await processQuestion(text);
  };

  const { isListening, startListening, stopListening } = useVoiceRecognition(handleVoiceResult, false);

  const processQuestion = async (question) => {
    if (!question.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: question }]);
    setIsProcessing(true);

    const response = await vickieService.processQuestion(question);

    setMessages(prev => [...prev, { type: 'assistant', text: response.message }]);
    setIsProcessing(false);
    setInputText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processQuestion(inputText);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleClearConversation = () => {
    setMessages([defaultMessage]);
    clearConversation(AI_MODAL_STORAGE_KEYS.VICKIE);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <button
        onClick={handleMaximize}
        className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all flex items-center gap-3 animate-bounce-subtle"
      >
        <span className="text-2xl">🎵</span>
        <span className="font-semibold">Vickie</span>
        <Maximize2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-2xl w-full h-[85vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="webby-award-gradient p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              Vickie - Music Assistant
            </h2>
            <p className="text-purple-100 mt-1">Ask me anything about music!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearConversation}
              type="button"
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all cursor-pointer"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleMinimize}
              type="button"
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all cursor-pointer"
              aria-label="Minimize assistant"
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all cursor-pointer"
              aria-label="Close assistant"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-lg animate-scale-in ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gradient-to-r from-white to-gray-50 text-gray-900 border-2 border-gray-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-xl transition-all shadow-lg ${
                isListening
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-xl animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-xl hover:scale-105'
              }`}
            >
              {isListening ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <MicOff className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about music theory, notation, or the app..."
              className="flex-1 px-4 py-3 premium-input rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="px-6 py-3 premium-button rounded-xl transition-all relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VickieMusicAssistant;
