
import React from 'react';

interface AssistantTileProps {
  isConnected: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export const AssistantTile: React.FC<AssistantTileProps> = ({ isConnected, isSpeaking, onToggle }) => {
  return (
    <div 
        onClick={onToggle}
        className={`
            lg:col-span-1 group relative overflow-hidden rounded-3xl p-8 cursor-pointer transition-all duration-500
            flex flex-col items-center justify-center text-center gap-6 shadow-xl border
            ${isConnected 
                ? 'bg-black border-black shadow-2xl scale-[1.02]' 
                : 'bg-white border-gray-100 hover:border-black hover:shadow-2xl'
            }
        `}
    >
        {/* Background Effects */}
        {isConnected ? (
             <>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
                {/* Animated Gradient Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-3xl animate-[spin_8s_linear_infinite]"></div>
             </>
        ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 z-0"></div>
        )}

        {/* Visualizer / Icon */}
        <div className="relative z-10 w-32 h-32 flex items-center justify-center">
            {isConnected ? (
                // Active Visualizer
                <div className="flex items-center gap-2">
                     <div className={`w-3 bg-gradient-to-t from-yellow-400 to-red-500 rounded-full transition-all duration-150 ${isSpeaking ? 'h-24 animate-[bounce_0.4s_infinite]' : 'h-8 animate-pulse'}`}></div>
                     <div className={`w-3 bg-gradient-to-t from-red-500 to-purple-500 rounded-full transition-all duration-150 delay-75 ${isSpeaking ? 'h-32 animate-[bounce_0.5s_infinite]' : 'h-12 animate-pulse'}`}></div>
                     <div className={`w-3 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full transition-all duration-150 delay-150 ${isSpeaking ? 'h-20 animate-[bounce_0.6s_infinite]' : 'h-6 animate-pulse'}`}></div>
                     <div className={`w-3 bg-gradient-to-t from-blue-500 to-teal-400 rounded-full transition-all duration-150 delay-100 ${isSpeaking ? 'h-28 animate-[bounce_0.45s_infinite]' : 'h-10 animate-pulse'}`}></div>
                </div>
            ) : (
                // Idle Icon (Innovative Sparkle)
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#FFCC00] to-orange-400 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
                    <svg className="w-full h-full text-gray-900 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <path d="M12 7v6"></path>
                        <path d="M9 10h6"></path>
                    </svg>
                    {/* Sparkles */}
                    <div className="absolute -top-2 -right-2 text-yellow-500">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>
                    </div>
                </div>
            )}
        </div>

        {/* Text Content */}
        <div className="relative z-10">
            <h2 className={`text-2xl font-bold mb-2 transition-colors ${isConnected ? 'text-white' : 'text-gray-900'}`}>
                {isConnected ? (isSpeaking ? "Ich höre zu..." : "Ich höre...") : "Frag den Assistenten"}
            </h2>
            <p className={`text-sm font-medium transition-colors ${isConnected ? 'text-gray-300' : 'text-gray-500'}`}>
                {isConnected 
                  ? "Sprechen Sie jetzt einfach..." 
                  : "Klicken zum Starten. Unser KI-Agent hilft sofort."}
            </p>
        </div>

        {/* Action Button Indicator */}
        {!isConnected && (
            <div className="relative z-10 mt-4">
                <div className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg group-hover:bg-[#FFCC00] group-hover:text-black transition-colors flex items-center gap-2">
                    <span>Starten</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </div>
        )}
    </div>
  );
};
