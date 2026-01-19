
import React from 'react';

interface AssistantTileProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isConnecting?: boolean; // New Prop
  onToggle: () => void;
}

export const AssistantTile: React.FC<AssistantTileProps> = ({ isConnected, isSpeaking, isConnecting = false, onToggle }) => {
  
  const handleToggle = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onToggle();
  };

  return (
    <div className="flex flex-col h-full w-full">
        <button 
            onClick={handleToggle}
            className={`
                relative group w-full h-full min-h-[400px] rounded-3xl 
                flex flex-col items-center justify-center p-6
                transition-all duration-300 ease-out outline-none
                ${isConnected 
                    ? 'bg-black shadow-2xl scale-[1.02]' 
                    : 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-black hover:shadow-2xl'
                }
            `}
        >
             {/* Background Effects for Active State */}
             {isConnected && (
                 <>
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden">
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-t from-indigo-500 via-purple-500 to-orange-500 opacity-40 blur-3xl transition-all duration-200 ${isSpeaking ? 'scale-125' : 'scale-100 animate-pulse'}`}></div>
                    </div>
                 </>
             )}

            {/* Icon / Visualizer */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full gap-8">
                 {isConnecting ? (
                     <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verbinde...</span>
                    </div>
                 ) : isConnected ? (
                     // Visualizer
                     <div className="flex flex-col items-center gap-8">
                         <div className="flex gap-2 items-center justify-center h-20">
                             <div className={`w-2 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-12' : 'h-4 animate-pulse'}`}></div>
                             <div className={`w-2 bg-white rounded-full transition-all duration-150 delay-75 ${isSpeaking ? 'h-20' : 'h-8 animate-pulse'}`}></div>
                             <div className={`w-2 bg-white rounded-full transition-all duration-150 delay-150 ${isSpeaking ? 'h-10' : 'h-4 animate-pulse'}`}></div>
                             <div className={`w-2 bg-white rounded-full transition-all duration-150 delay-100 ${isSpeaking ? 'h-16' : 'h-6 animate-pulse'}`}></div>
                         </div>
                         <div className="text-white text-sm font-medium opacity-80 animate-pulse">
                             {isSpeaking ? 'Ich spreche...' : 'Ich höre zu...'}
                         </div>
                     </div>
                 ) : (
                     // THE NEW ICON (Robot + Sparkle)
                     <>
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-500/20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="8" width="16" height="12" rx="4" />
                                    <path d="M9 13v.01" strokeWidth="3" />
                                    <path d="M15 13v.01" strokeWidth="3" />
                                    <path d="M12 8V4" />
                                    <path d="M12 4H15" />
                                    <path d="M2 14H4" />
                                    <path d="M20 14H22" />
                                 </svg>
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center animate-[bounce_4s_infinite] border border-gray-50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFCC00"/>
                                    <path d="M18 17L19 20L22 21L19 22L18 25L17 22L14 21L17 20L18 17Z" fill="#FFCC00" transform="scale(0.4) translate(20,20)"/>
                                </svg>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                             <h3 className="text-2xl font-bold text-gray-900 group-hover:text-black">PostAssistant</h3>
                             <p className="text-gray-500 font-medium group-hover:text-gray-700">Klicken zum Starten</p>
                        </div>
                     </>
                 )}
            </div>
            
            {!isConnected && !isConnecting && (
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-black bg-gray-100 px-4 py-2 rounded-full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                        Sprechen
                    </div>
                </div>
            )}
        </button>
    </div>
  );
};
