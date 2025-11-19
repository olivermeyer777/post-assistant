
import React from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageBarProps {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
}

// Flat Globe Icon
const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

export const LanguageBar: React.FC<LanguageBarProps> = ({ currentLang, setLanguage }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-[998] py-4 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
        
        <div className="flex items-center gap-3 opacity-70 md:absolute md:left-6">
           <GlobeIcon />
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sprache</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50 mx-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${currentLang === lang.code 
                  ? 'bg-black text-white shadow-lg shadow-gray-900/20 scale-105' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}
              `}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
