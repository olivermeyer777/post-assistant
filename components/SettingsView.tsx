
import React, { useState } from 'react';
import { useAppSettings, ProcessConfig } from '../hooks/useAppSettings';

export const SettingsView = () => {
  const { settings, updateProcessConfig, updateAssistant } = useAppSettings();
  const [activeTab, setActiveTab] = useState<'global' | 'processes'>('global');
  
  // State for Master-Detail view in Processes tab
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>('packet');

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans selection:bg-yellow-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#FFCC00] flex items-center justify-center rounded-2xl shadow-sm border border-yellow-400">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PostAssistant Konfiguration</h1>
                    <p className="text-gray-500">Verwalten Sie das Verhalten des KI-Assistenten und die Prozesse.</p>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 self-start md:self-auto">
                <button 
                    onClick={() => setActiveTab('global')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Global & Persona
                </button>
                <button 
                    onClick={() => setActiveTab('processes')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'processes' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Prozesse & Details
                </button>
            </div>
        </header>

        {/* --- GLOBAL SETTINGS TAB --- */}
        {activeTab === 'global' && (
            <div className="space-y-8 animate-fade-in">
                
                {/* 1. General Persona */}
                <section className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8">
                     <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                        <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                        Persona & Verhalten
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Voice */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stimme</label>
                            <select 
                                value={settings.assistant.voiceName}
                                onChange={(e) => updateAssistant('voiceName', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] focus:ring-4 focus:ring-[#FFCC00]/20 outline-none transition-all"
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
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ansprache</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                 <button onClick={() => updateAssistant('politeness', 'formal')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'formal' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Sie</button>
                                 <button onClick={() => updateAssistant('politeness', 'casual')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'casual' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Du</button>
                            </div>
                        </div>

                        {/* Response Length */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ausführlichkeit</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                 <button onClick={() => updateAssistant('responseLength', 'short')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'short' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Kurz</button>
                                 <button onClick={() => updateAssistant('responseLength', 'medium')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'medium' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Mittel</button>
                                 <button onClick={() => updateAssistant('responseLength', 'long')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.responseLength === 'long' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Lang</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Global Prompts & Knowledge */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Instructions */}
                    <section className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-900">
                            <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            Genereller System Prompt
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Definieren Sie hier das grundsätzliche Verhalten des Assistenten (z.B. "sei reaktiv", "lies nicht vor").</p>
                        <textarea 
                            value={settings.assistant.globalPrompt}
                            onChange={(e) => updateAssistant('globalPrompt', e.target.value)}
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] outline-none min-h-[300px] text-sm font-mono leading-relaxed resize-none shadow-inner"
                            placeholder="Z.B. Sei immer freundlich..."
                        />
                    </section>

                    {/* Knowledge Base */}
                    <section className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-900">
                            <span className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </span>
                            Knowledge Base (Wissen)
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Fakten, auf die sich der Assistent beschränken soll. Er darf nichts erfinden.</p>
                        <textarea 
                            value={settings.assistant.knowledgeBase}
                            onChange={(e) => updateAssistant('knowledgeBase', e.target.value)}
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] outline-none min-h-[300px] text-sm font-mono leading-relaxed resize-none shadow-inner"
                            placeholder="- Öffnungszeiten: ..."
                        />
                    </section>
                </div>
            </div>
        )}

        {/* --- PROCESS SETTINGS TAB (MASTER-DETAIL VIEW) --- */}
        {activeTab === 'processes' && (
             <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] animate-fade-in">
                 
                 {/* 1. Sidebar List */}
                 <div className="lg:w-1/3 bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                     <div className="p-6 border-b border-gray-100 bg-gray-50">
                         <h3 className="font-bold text-gray-900">Verfügbare Prozesse</h3>
                         <p className="text-xs text-gray-500 mt-1">Wählen Sie einen Prozess zur Konfiguration</p>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-3">
                         {(Object.entries(settings.processes) as [string, ProcessConfig][]).map(([key, config]) => (
                             <button
                                key={key}
                                onClick={() => setSelectedProcessId(key)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                                    ${selectedProcessId === key 
                                        ? 'bg-[#FFCC00] border-[#FFCC00] shadow-md' 
                                        : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-2.5 h-2.5 rounded-full ${config.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                     <span className={`font-bold ${selectedProcessId === key ? 'text-black' : 'text-gray-700'}`}>{config.label}</span>
                                 </div>
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedProcessId === key ? 'opacity-100 text-black' : 'text-gray-400'}`}>
                                     <polyline points="9 18 15 12 9 6"></polyline>
                                 </svg>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* 2. Detail Editor */}
                 <div className="lg:w-2/3 bg-white rounded-[2rem] shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
                     {selectedProcessId && settings.processes[selectedProcessId] ? (
                         <>
                             {/* Detail Header */}
                             <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm border border-gray-100">
                                         {selectedProcessId.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                         <h2 className="text-2xl font-bold text-gray-900">{settings.processes[selectedProcessId].label}</h2>
                                         <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">ID: {selectedProcessId}</span>
                                     </div>
                                 </div>
                                 
                                 {/* Enable/Disable Toggle */}
                                 <div className="flex items-center gap-3">
                                     <span className="text-sm font-bold text-gray-500 uppercase">{settings.processes[selectedProcessId].isEnabled ? 'Aktiv' : 'Inaktiv'}</span>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.processes[selectedProcessId].isEnabled} 
                                            onChange={(e) => updateProcessConfig(selectedProcessId, { isEnabled: e.target.checked })}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                 </div>
                             </div>

                             {/* Detail Content */}
                             <div className="flex-1 p-8 overflow-y-auto">
                                 {settings.processes[selectedProcessId].isEnabled ? (
                                     <div className="space-y-6 h-full flex flex-col">
                                         <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFCC00]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                Instruktionen für den Assistenten
                                            </label>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Beschreiben Sie genau, wie sich der Assistent in diesem spezifischen Prozess verhalten soll. 
                                                Soll er proaktiv helfen? Soll er sich zurückhalten? Gibt es spezielle Hinweise?
                                            </p>
                                         </div>
                                         
                                         <textarea 
                                            value={settings.processes[selectedProcessId].customPrompt}
                                            onChange={(e) => updateProcessConfig(selectedProcessId, { customPrompt: e.target.value })}
                                            className="flex-1 w-full p-6 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] focus:ring-4 focus:ring-[#FFCC00]/10 outline-none text-base font-medium leading-relaxed resize-none shadow-inner"
                                            placeholder="Z.B.: In diesem Schritt ist der Kunde oft unsicher beim Wiegen. Biete sofort Hilfe an, wenn Stille herrscht."
                                         />

                                         <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100 flex gap-3">
                                             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                             <p>Diese Instruktion wird zusätzlich zum globalen Prompt geladen, sobald der Kunde diesen Prozessschritt betritt.</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                         <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-300">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="15" y1="9" x2="9" y2="15"></line>
                                            <line x1="9" y1="9" x2="15" y2="15"></line>
                                         </svg>
                                         <p className="text-lg font-medium">Dieser Prozess ist deaktiviert.</p>
                                         <p className="text-sm">Aktivieren Sie ihn oben rechts, um Einstellungen vorzunehmen.</p>
                                     </div>
                                 )}
                             </div>
                         </>
                     ) : (
                         <div className="flex-1 flex items-center justify-center text-gray-400">
                             <p>Wählen Sie einen Prozess aus der Liste.</p>
                         </div>
                     )}
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};
