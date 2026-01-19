
import React from 'react';

interface VoiceControlProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isConnecting?: boolean; // New Prop
  onToggle: () => void;
  isVideoCallActive?: boolean;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ 
  isConnected, 
  isSpeaking, 
  isConnecting = false,
  onToggle,
  isVideoCallActive = false
}) => {

  if (isVideoCallActive) return null;

  // Safe handler to prevent bubbling issues
  const handleToggle = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onToggle();
  };

  return (
    // Positioned centered at the bottom, slightly elevated to sit above the LanguageBar
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center animate-fade-in">
      
      {/* The Clickable Trigger Area - Reusing the Pill Design from AssistantTile */}
      <button 
            onClick={handleToggle}
            className={`
                relative group w-[140px] aspect-[1/2.4] rounded-[10rem] 
                flex flex-col items-center justify-center
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none
                ${isConnected 
                    ? 'bg-black scale-105 shadow-2xl' 
                    : 'bg-white hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-2 border-white'
                }
            `}
        >
             {/* Background Effects for Active State */}
             {isConnected && (
                 <>
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black rounded-[10rem] overflow-hidden">
                         {/* Animated Speaking Gradient */}
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-t from-indigo-500 via-purple-500 to-orange-500 opacity-40 blur-3xl transition-all duration-200 ${isSpeaking ? 'scale-125' : 'scale-100 animate-pulse'}`}></div>
                    </div>
                 </>
             )}

            {/* Icon / Visualizer */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
                 {isConnecting ? (
                    // LOADING SPINNER
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-gray-400">Verbinde...</span>
                    </div>
                 ) : isConnected ? (
                     // Visualizer
                     <div className="flex flex-col items-center gap-6">
                         <div className="flex gap-1.5 items-center justify-center h-16">
                             <div className={`w-1.5 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-10' : 'h-3 animate-pulse'}`}></div>
                             <div className={`w-1.5 bg-white rounded-full transition-all duration-150 delay-75 ${isSpeaking ? 'h-14' : 'h-6 animate-pulse'}`}></div>
                             <div className={`w-1.5 bg-white rounded-full transition-all duration-150 delay-150 ${isSpeaking ? 'h-8' : 'h-3 animate-pulse'}`}></div>
                             <div className={`w-1.5 bg-white rounded-full transition-all duration-150 delay-100 ${isSpeaking ? 'h-12' : 'h-4 animate-pulse'}`}></div>
                         </div>
                         <div className="text-white text-xs font-medium opacity-80 animate-pulse">
                             {isSpeaking ? 'Ich spreche...' : 'Ich höre...'}
                         </div>
                     </div>
                 ) : (
                     // THE ROBOT + SPARKLE ICON
                     <div className="relative">
                        {/* Main Icon Box */}
                        <div className="w-16 h-16 bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="8" width="16" height="12" rx="4" />
                                <path d="M9 13v.01" strokeWidth="3" />
                                <path d="M15 13v.01" strokeWidth="3" />
                                <path d="M12 8V4" />
                                <path d="M12 4H15" />
                                <path d="M2 14H4" />
                                <path d="M20 14H22" />
                             </svg>
                        </div>
                        {/* Sparkle Badge */}
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center animate-[bounce_4s_infinite] border border-gray-50">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFCC00"/>
                                <path d="M18 17L19 20L22 21L19 22L18 25L17 22L14 21L17 20L18 17Z" fill="#FFCC00" transform="scale(0.4) translate(20,20)"/>
                            </svg>
                        </div>
                     </div>
                 )}
            </div>

            {/* Floating Chip overlapping the button */}
            {!isConnected && !isConnecting && (
                <div className="absolute -bottom-5 z-20 w-max pointer-events-none">
                    <div className="relative">
                         {/* The Chip - explicit onClick added */}
                        <div 
                             onClick={handleToggle}
                             className="bg-gray-900 text-white pl-3 pr-4 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white pointer-events-auto cursor-pointer hover:scale-105 transition-transform"
                        >
                             <div className="relative flex items-center justify-center w-5 h-5 bg-white/10 rounded-full">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFCC00]">
                                    <path d="M14 9l-6 6" />
                                    <path d="M10 9a6.3 6.3 0 0 0-6.7-1C1.8 8.6.5 10.6.5 12.8c0 3 2.5 5.2 4.6 7.2L9 23" />
                                    <path d="M13.5 13.5a3 3 0 0 1 .5 4 4.5 4.5 0 0 1-4.24 3.5" />
                                    <path d="M16 11a5 5 0 0 1 5 5v5" />
                                    <path d="M19 6a3 3 0 0 0-3-3h-3v6" />
                                </svg>
                             </div>
                             <div className="flex flex-col items-start leading-none gap-0.5">
                                 <span className="font-bold text-xs text-white">Hilfe?</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </button>
    </div>
  );
};
