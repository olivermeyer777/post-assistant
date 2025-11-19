
import React from 'react';

interface VoiceControlProps {
  isConnected: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ isConnected, isSpeaking, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full flex items-center justify-center 
        shadow-2xl z-[999] transition-all duration-300
        ${isConnected 
          ? 'bg-red-500 animate-pulse ring-4 ring-red-200' 
          : 'bg-gray-900 hover:bg-black hover:scale-110'}
      `}
      aria-label="Voice Control"
    >
      {isConnected ? (
        <div className="flex gap-1 items-center justify-center h-6">
            {/* Waveform animation */}
            <div className={`w-1 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-6 animate-bounce' : 'h-2'}`}></div>
            <div className={`w-1 bg-white rounded-full transition-all duration-150 delay-75 ${isSpeaking ? 'h-8 animate-bounce' : 'h-3'}`}></div>
            <div className={`w-1 bg-white rounded-full transition-all duration-150 delay-150 ${isSpeaking ? 'h-5 animate-bounce' : 'h-2'}`}></div>
        </div>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      )}
    </button>
  );
};
