import React from 'react';
import { TranslationData } from '../types';

interface OracleViewProps {
  t: TranslationData;
  buttons: string[];
  onButtonClick: (text: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const OracleView: React.FC<OracleViewProps> = ({ t, buttons, onButtonClick, onBack, onNext }) => {
  return (
    <section className="mt-10 animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-3 text-gray-900">
        {t.orakelViewTitle}
      </h1>
      <p className="text-center text-gray-500 mb-8 text-lg">
        {t.orakelViewSubtitle}
      </p>

      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        <div className="flex flex-wrap gap-3 justify-center mb-8 min-h-[100px] items-center content-center">
          {buttons.map((btnText, idx) => (
            <button
              key={idx}
              onClick={() => onButtonClick(btnText)}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium bg-white text-gray-700 cursor-pointer transition-all hover:bg-yellow-400 hover:border-yellow-400 hover:text-black hover:shadow-md active:scale-95"
            >
              {btnText}
            </button>
          ))}
          {buttons.length === 0 && (
             <div className="flex gap-1">
               <span className="w-2 h-2 bg-gray-200 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-200 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-gray-200 rounded-full animate-bounce delay-150"></span>
             </div>
          )}
        </div>

        <div className="flex justify-between gap-4 border-t border-gray-100 pt-6">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl py-3 px-4 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {t.ui.back}
          </button>
          <button
            onClick={onNext}
            className="flex-1 rounded-xl py-3 px-4 text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-lg shadow-gray-900/20"
          >
            {t.ui.next}
          </button>
        </div>
      </div>
    </section>
  );
};