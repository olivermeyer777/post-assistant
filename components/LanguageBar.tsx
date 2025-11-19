import React from 'react';
import { LANGUAGES } from '../constants';
// Fix: Import Language type from types.ts
import { Language } from '../types';

interface LanguageBarProps {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageBar: React.FC<LanguageBarProps> = ({ currentLang, setLanguage }) => {
  return (
    <div className="fixed left-4 bottom-4 flex flex-wrap gap-1.5 z-[998]">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            rounded-full border-none px-2.5 py-1.5 text-xs flex items-center gap-1.5
            shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer transition-colors
            ${currentLang === lang.code ? 'bg-[#111] text-white' : 'bg-white text-[#111]'}
          `}
        >
          <span className="text-[10px]">🌐</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};