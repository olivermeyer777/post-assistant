
import React, { useState } from 'react';

interface VoiceControlProps {
  isConnected: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  isVideoCallActive?: boolean;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ 
  isConnected, 
  isSpeaking, 
  onToggle,
  isVideoCallActive = false
}) => {
  const [showDisconnectFeedback, setShowDisconnectFeedback] = useState(false);

  const handleClick = () => {
    if (isConnected) {
      // User is turning it off
      onToggle(); // Disconnect
      setShowDisconnectFeedback(true);
      // Show red state for 2 seconds then revert to idle
      setTimeout(() => {
        setShowDisconnectFeedback(false);
      }, 2000);
    } else {
      // User is turning it on
      setShowDisconnectFeedback(false);
      onToggle();
    }
  };

  if (isVideoCallActive) return null;

  // Gradient Definition for SVG
  const IconGradient = () => (
    <defs>
      <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFCC00" /> 
        <stop offset="100%" stopColor="#F59E0B" /> 
      </linearGradient>
    </defs>
  );

  return (
    // Moved to bottom-right to replace the chat button
    <div className="fixed right-6 bottom-24 z-[1000] flex flex-col items-end gap-2">
      
      {/* Label / Tooltip - Always visible when idle to invite user */}
      <div className={`
        bg-black text-white px-4 py-2 rounded-xl shadow-lg border border-gray-800
        font-bold text-sm mb-2 transition-all duration-300 cursor-pointer
        ${isConnected ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
      `}
      onClick={handleClick}
      >
        Frag den Assistenten
      </div>

      {/* Status Label (When Active) */}
      <div className={`
        absolute right-24 top-1/2 -translate-y-1/2
        whitespace-nowrap px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100
        font-bold text-sm
        transition-all duration-500 origin-right
        ${isConnected ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 translate-x-4 pointer-events-none'}
      `}>
        <span className="bg-gradient-to-r from-indigo-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
           {isSpeaking ? 'Ich spreche...' : 'Ich höre zu...'}
        </span>
      </div>

      <button
        onClick={handleClick}
        className={`
          relative flex items-center justify-center 
          rounded-full border transition-all duration-300
          ${isConnected 
            ? 'w-20 h-20 bg-white border-black shadow-[0_0_40px_rgba(0,0,0,0.2)] scale-100' 
            : showDisconnectFeedback 
              ? 'w-16 h-16 bg-red-50 border-red-200 shadow-lg' 
              : 'w-16 h-16 bg-[#FFCC00] border-white shadow-xl hover:scale-105'
          }
        `}
        aria-label="Voice Agent Control"
      >
        {/* Active State Glow */}
        {isConnected && (
          <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-500 rounded-full animate-pulse"></div>
            <div className="absolute -inset-4 rounded-full border border-indigo-500/30 animate-[spin_4s_linear_infinite]"></div>
          </div>
        )}

        {/* Icons */}
        <div className="relative z-10 text-gray-900">
            {showDisconnectFeedback ? (
                // Disconnected
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-300">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            ) : isConnected ? (
                // Active (Waveform Visualizer)
                <div className="flex gap-1 items-center justify-center h-8">
                    <div className={`w-1.5 rounded-full bg-gradient-to-t from-indigo-600 to-pink-600 transition-all duration-150 ${isSpeaking ? 'h-8 animate-[bounce_0.8s_infinite]' : 'h-4 animate-[pulse_1s_infinite]'}`}></div>
                    <div className={`w-1.5 rounded-full bg-gradient-to-t from-pink-600 to-amber-600 transition-all duration-150 delay-75 ${isSpeaking ? 'h-10 animate-[bounce_0.8s_infinite_0.1s]' : 'h-6 animate-[pulse_1s_infinite_0.2s]'}`}></div>
                    <div className={`w-1.5 rounded-full bg-gradient-to-t from-amber-600 to-indigo-600 transition-all duration-150 delay-200 ${isSpeaking ? 'h-6 animate-[bounce_0.8s_infinite_0.2s]' : 'h-3 animate-[pulse_1s_infinite_0.4s]'}`}></div>
                </div>
            ) : (
                // Idle (Digital Assistant Sparkle Icon)
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <path d="M9 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" fill="currentColor" stroke="none" />
                    <path d="M19 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" fill="currentColor" stroke="none" />
                 </svg>
            )}
        </div>
      </button>
    </div>
  );
};
