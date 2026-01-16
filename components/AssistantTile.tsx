
import React from 'react';

interface AssistantTileProps {
  isConnected: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export const AssistantTile: React.FC<AssistantTileProps> = ({ isConnected, isSpeaking, onToggle }) => {
  return (
    <div className="lg:col-span-1 flex flex-col items-center justify-center h-full gap-6 p-4">
        
        {/* The Clickable Trigger Area - Vertical Pill Shape */}
        <button 
            onClick={onToggle}
            className={`
                relative group w-full max-w-[160px] aspect-[1/2.4] rounded-[10rem] 
                flex flex-col items-center justify-center
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none
                ${isConnected 
                    ? 'bg-black scale-105 shadow-2xl' 
                    : 'bg-white hover:scale-105 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.12)] border border-white'
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
                 {isConnected ? (
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
                     // THE NEW ICON (Robot + Sparkle)
                     <div className="relative">
                        {/* Main Icon Box - Purple/Pink Gradient Squircle */}
                        <div className="w-20 h-20 bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                             {/* Robot Face SVG */}
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {/* Head */}
                                <rect x="4" y="8" width="16" height="12" rx="4" />
                                {/* Eyes */}
                                <path d="M9 13v.01" strokeWidth="3" />
                                <path d="M15 13v.01" strokeWidth="3" />
                                {/* Antenna */}
                                <path d="M12 8V4" />
                                <path d="M12 4H15" />
                                {/* Ears */}
                                <path d="M2 14H4" />
                                <path d="M20 14H22" />
                             </svg>
                        </div>

                        {/* Sparkle Badge */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center animate-[bounce_4s_infinite] border border-gray-50">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFCC00"/>
                                <path d="M18 17L19 20L22 21L19 22L18 25L17 22L14 21L17 20L18 17Z" fill="#FFCC00" transform="scale(0.4) translate(20,20)"/>
                            </svg>
                        </div>
                     </div>
                 )}
            </div>
        </button>

        {/* Red Hint Text Below */}
        {!isConnected && (
            <div className="text-center animate-fade-in -mt-2">
                <div className="bg-red-50 text-red-600 font-bold px-4 py-1.5 rounded-full border border-red-100 shadow-sm inline-flex items-center gap-2 text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Ich helfe Ihnen gerne weiter!
                </div>
            </div>
        )}
    </div>
  );
};
