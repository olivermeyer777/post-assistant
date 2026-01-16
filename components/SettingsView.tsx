
import React from 'react';
import { useAppSettings } from '../hooks/useAppSettings';

export const SettingsView = () => {
  const { settings, updateProcess, updateAssistant } = useAppSettings();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFCC00] flex items-center justify-center rounded-xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">App Konfiguration & Demo Settings</h1>
        </header>

        <div className="space-y-8">
            {/* Business Processes Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Geschäftsprozesse (Tiles)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(settings.processes).map(([key, isActive]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="font-medium capitalize text-gray-700">{key === 'packet' ? 'Paket aufgeben' : key === 'letter' ? 'Brief versenden' : key === 'payment' ? 'Einzahlung' : 'Tracking'}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isActive} 
                                    onChange={(e) => updateProcess(key as any, e.target.checked)}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFCC00]"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Assistant Settings */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    KI Assistent Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Voice */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Stimme</label>
                        <select 
                            value={settings.assistant.voiceName}
                            onChange={(e) => updateAssistant('voiceName', e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] outline-none"
                        >
                            <option value="Puck">Puck (Neutral/Male)</option>
                            <option value="Charon">Charon (Deep/Male)</option>
                            <option value="Kore">Kore (Neutral/Female)</option>
                            <option value="Fenrir">Fenrir (Deep/Male)</option>
                            <option value="Aoede">Aoede (Soft/Female)</option>
                        </select>
                    </div>

                    {/* Politeness */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Höflichkeitsstil</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                             <button 
                                onClick={() => updateAssistant('politeness', 'formal')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'formal' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Sie (Formell)
                             </button>
                             <button 
                                onClick={() => updateAssistant('politeness', 'casual')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'casual' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Du (Informell)
                             </button>
                        </div>
                    </div>

                    {/* Response Length */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Satzlänge</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                             <button 
                                onClick={() => updateAssistant('responseLength', 'short')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'short' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Kurz
                             </button>
                             <button 
                                onClick={() => updateAssistant('responseLength', 'medium')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'medium' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Mittel
                             </button>
                             <button 
                                onClick={() => updateAssistant('responseLength', 'long')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'long' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Lang
                             </button>
                        </div>
                    </div>

                     {/* Proactivity */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Betreuungsstil</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                             <button 
                                onClick={() => updateAssistant('supportStyle', 'reactive')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.supportStyle === 'reactive' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Reaktiv
                             </button>
                             <button 
                                onClick={() => updateAssistant('supportStyle', 'medium')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.supportStyle === 'medium' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Ausgewogen
                             </button>
                             <button 
                                onClick={() => updateAssistant('supportStyle', 'proactive')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.supportStyle === 'proactive' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                             >
                                 Proaktiv
                             </button>
                        </div>
                    </div>
                </div>

                {/* Custom Prompt */}
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Zusätzlicher System Prompt</label>
                    <textarea 
                        value={settings.assistant.customPrompt}
                        onChange={(e) => updateAssistant('customPrompt', e.target.value)}
                        placeholder="Z.B. 'Erwähne immer, dass heute ein schöner Tag ist' oder 'Antworte wie ein Pirat'"
                        className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] outline-none min-h-[100px]"
                    />
                    <p className="text-xs text-gray-400 mt-2">Dieser Text wird an die generierte System-Instruktion angehängt.</p>
                </div>

            </section>
        </div>
      </div>
    </div>
  );
};
