
import React from 'react';
import { LANGUAGES, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LanguageBarProps {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
  isAccessibilityMode: boolean;
  toggleAccessibility: () => void;
}

// Flat Globe Icon
const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// Accessibility Icon (Eye/Person)
const AccessibilityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="4"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

export const LanguageBar: React.FC<LanguageBarProps> = ({ 
  currentLang, 
  setLanguage, 
  isAccessibilityMode, 
  toggleAccessibility 
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-[998] py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Label (Hidden on mobile to save space if needed, but kept for now) */}
        <div className="hidden md:flex items-center gap-3 opacity-70">
           <GlobeIcon />
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sprache / Language</span>
        </div>

        {/* Center: Language Selection */}
        <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50 overflow-x-auto max-w-full">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
                ${currentLang === lang.code 
                  ? 'bg-black text-white shadow-lg shadow-gray-900/20 scale-105' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}
              `}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Right: Accessibility Toggle */}
        <div className="flex items-center">
           <button
             onClick={toggleAccessibility}
             className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border
                ${isAccessibilityMode 
                   ? 'bg-black text-white border-black shadow-lg scale-105 ring-2 ring-offset-2 ring-black' 
                   : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
             `}
             aria-label={t.ui.accessibility}
             aria-pressed={isAccessibilityMode}
           >
             <AccessibilityIcon />
             <span className="hidden sm:inline">{t.ui.accessibility}</span>
           </button>
        </div>

      </div>
    </div>
  );
};