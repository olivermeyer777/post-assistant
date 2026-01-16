import React, { useState, useRef, useEffect } from 'react';
import { Message, TranslationData, Language } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ChatBoxProps {
  isOpen: boolean;
  isMinimized: boolean;
  setMinimized: (min: boolean) => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  t: TranslationData;
  isVoiceActive: boolean; 
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  currentLang: Language;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  isOpen,
  isMinimized,
  setMinimized,
  messages,
  onSendMessage,
  isThinking,
  t,
  isVoiceActive,
  isSoundEnabled,
  onToggleSound,
  currentLang
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition();
  const initialInputRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      // Store current input so we can append to it
      initialInputRef.current = inputValue;
      
      startListening(currentLang, (text, isFinal) => {
        // Determine separator: if input was empty, no space. If not empty, add space.
        const prefix = initialInputRef.current;
        const separator = prefix && !prefix.endsWith(' ') ? ' ' : '';
        const newText = prefix + separator + text;
        
        setInputValue(newText);
        
        if (isFinal) {
          // Auto-send on final result
          onSendMessage(newText);
          setInputValue('');
        }
      });
    }
  };

  if (!isOpen) return null;

  // The yellow floating button (FAB) has been removed as requested.
  // The ChatBox now only renders when NOT minimized, or implicitly relies on other triggers to open.
  if (isMinimized) {
    return null; 
  }

  return (
    <>
      <div className="fixed right-4 sm:right-6 bottom-[90px] w-auto left-4 sm:left-auto sm:w-[380px] max-w-[calc(100%-32px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[400px] max-h-[600px] z-[998] border border-gray-100">
        {/* Modern Header */}
        <div className="px-4 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-xs">PA</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-900"></div>
             </div>
            <div>
              <div className="font-semibold text-sm">{t.chatHeaderTitle}</div>
              <div className="text-[10px] text-gray-300 opacity-80">Online</div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isSoundEnabled ? 'text-yellow-400 bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}
              title={isSoundEnabled ? "Ton aus" : "Ton an"}
            >
               {isSoundEnabled ? (
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                   <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                 </svg>
               ) : (
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                   <line x1="23" y1="9" x2="17" y2="15"></line>
                   <line x1="17" y1="9" x2="23" y2="15"></line>
                 </svg>
               )}
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Minimieren"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="p-4 flex-1 overflow-y-auto bg-gray-50 flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`
                max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.sender === 'user' 
                  ? 'ml-auto bg-gray-900 text-white rounded-br-none' 
                  : 'mr-auto bg-white text-gray-800 rounded-bl-none border border-gray-100'}
              `}
            >
              {msg.text}
            </div>
          ))}
          {isThinking && (
            <div className="mr-auto bg-white border border-gray-100 rounded-2xl rounded-bl-none p-3.5 shadow-sm flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Modern Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isVoiceActive} // Disable text dictation if Global Voice Mode is active
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : isVoiceActive 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={isListening ? "Listening..." : "Speech to Text"}
          >
            {isListening ? (
              <div className="flex gap-0.5 items-center h-3">
                  <div className="w-0.5 bg-red-600 animate-[bounce_1s_infinite] h-3"></div>
                  <div className="w-0.5 bg-red-600 animate-[bounce_1s_infinite_0.1s] h-4"></div>
                  <div className="w-0.5 bg-red-600 animate-[bounce_1s_infinite_0.2s] h-2"></div>
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </button>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-gray-50 rounded-xl border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
            type="text"
            autoComplete="off"
            placeholder={isListening ? "Listening..." : (isVoiceActive ? "Voice Active..." : t.chatPlaceholder)}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFCC00] text-gray-900 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-bold"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
};