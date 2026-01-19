
import React, { useState } from 'react';
import { useAppSettings, ProcessConfig, KnowledgeDocument } from '../hooks/useAppSettings';

// --- Sub-Component for File Management ---
const KnowledgeManager = ({ 
    documents, 
    onAdd, 
    onRemove, 
    title, 
    description 
}: { 
    documents: KnowledgeDocument[], 
    onAdd: (doc: KnowledgeDocument) => void, 
    onRemove: (id: string) => void,
    title: string,
    description: string
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const handleSave = () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        onAdd({
            id: Math.random().toString(36).substr(2, 9),
            title: newTitle,
            content: newContent,
            isActive: true
        });
        setNewTitle('');
        setNewContent('');
        setIsAdding(false);
    };

    return (
        <section className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-900">
                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                {title}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{description}</p>

            {/* List of Documents */}
            <div className="space-y-3 mb-6 flex-1">
                {documents.length === 0 && (
                    <div className="text-center p-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                        Keine Dokumente hinterlegt.
                    </div>
                )}
                {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl group hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
                                <span className="text-xs font-bold text-red-600">PDF</span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm truncate">{doc.title}</h4>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{doc.content.substring(0, 40)}...</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onRemove(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Entfernen"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Add New Area */}
            {isAdding ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                    <input 
                        className="w-full mb-3 p-3 text-sm font-bold border border-gray-200 rounded-lg focus:border-[#FFCC00] outline-none" 
                        placeholder="Dokument Name (z.B. AGB.pdf)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <textarea 
                        className="w-full mb-3 p-3 text-sm border border-gray-200 rounded-lg focus:border-[#FFCC00] outline-none min-h-[100px]" 
                        placeholder="Inhalt des Dokuments hier einfügen..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800">Speichern</button>
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Abbrechen</button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-[#FFCC00] hover:text-gray-600 hover:bg-[#FFCC00]/5 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Dokument hinzufügen / Upload
                </button>
            )}
        </section>
    );
}

export const SettingsView = () => {
  const { 
      settings, 
      updateProcessConfig, 
      updateAssistant, 
      addGlobalDocument, 
      removeGlobalDocument,
      addProcessDocument,
      removeProcessDocument 
  } = useAppSettings();

  const [activeTab, setActiveTab] = useState<'global' | 'processes'>('global');
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stimme (Global)</label>
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
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ansprache (Global)</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                 <button onClick={() => updateAssistant('politeness', 'formal')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'formal' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Sie</button>
                                 <button onClick={() => updateAssistant('politeness', 'casual')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.assistant.politeness === 'casual' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400'}`}>Du</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Global Documents & Prompts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Replaced Knowledge Base Textarea with Document Manager */}
                    <KnowledgeManager 
                        title="Globale Dokumente (Knowledge Base)"
                        description="Laden Sie hier PDFs hoch (z.B. AGB, Leitbilder), die für ALLE Prozesse gelten. Der Assistent greift immer darauf zu."
                        documents={settings.globalDocuments}
                        onAdd={addGlobalDocument}
                        onRemove={removeGlobalDocument}
                    />

                    {/* General System Prompt */}
                    <section className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-900">
                            <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            Genereller System Prompt
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Definieren Sie hier das grundsätzliche Verhalten des Assistenten.</p>
                        <textarea 
                            value={settings.assistant.globalPrompt}
                            onChange={(e) => updateAssistant('globalPrompt', e.target.value)}
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] outline-none min-h-[300px] text-sm font-mono leading-relaxed resize-none shadow-inner"
                            placeholder="Z.B. Sei immer freundlich..."
                        />
                    </section>
                </div>
            </div>
        )}

        {/* --- PROCESS SETTINGS TAB --- */}
        {activeTab === 'processes' && (
             <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] animate-fade-in">
                 
                 {/* 1. Sidebar */}
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
                             {/* Header */}
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

                             {/* Content */}
                             <div className="flex-1 p-8 overflow-y-auto bg-white">
                                 {settings.processes[selectedProcessId].isEnabled ? (
                                     <div className="space-y-8 h-full flex flex-col">
                                         
                                         {/* Inherited Info */}
                                         <div className="bg-gray-100/70 border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute -right-4 -top-4 text-gray-200 opacity-50 rotate-12">
                                                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.243 2 7 4.243 7 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10H17V7C17 4.243 14.757 2 12 2ZM15 10H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10Z" /></svg>
                                            </div>
                                            <div className="relative z-10">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    Geerbte Globale Konfiguration (Read-Only)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Stimme</span>
                                                        <span className="text-sm font-semibold text-gray-700">{settings.assistant.voiceName}</span>
                                                    </div>
                                                    <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Globale Dokumente</span>
                                                        <span className="text-sm font-semibold text-gray-700">{settings.globalDocuments.length} PDF(s) aktiv</span>
                                                    </div>
                                                </div>
                                            </div>
                                         </div>

                                         <div className="h-px bg-gray-100 w-full"></div>

                                         {/* Process Settings */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              {/* Verbosity */}
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Antwortlänge</label>
                                                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                                      {(['short', 'medium', 'long'] as const).map((opt) => (
                                                          <button 
                                                              key={opt}
                                                              onClick={() => updateProcessConfig(selectedProcessId, { responseLength: opt })}
                                                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase ${settings.processes[selectedProcessId].responseLength === opt ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                                          >
                                                              {opt === 'short' ? 'Kurz' : opt === 'medium' ? 'Mittel' : 'Lang'}
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                              {/* Intensity */}
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Betreuungs-Intensität</label>
                                                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                                      <button 
                                                          onClick={() => updateProcessConfig(selectedProcessId, { supportIntensity: 'passive' })}
                                                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase ${settings.processes[selectedProcessId].supportIntensity === 'passive' ? 'bg-white text-gray-600 shadow-sm border border-gray-200' : 'text-gray-400'}`}
                                                      >
                                                          Passiv
                                                      </button>
                                                      <button 
                                                          onClick={() => updateProcessConfig(selectedProcessId, { supportIntensity: 'proactive' })}
                                                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase ${settings.processes[selectedProcessId].supportIntensity === 'proactive' ? 'bg-[#FFCC00] text-black shadow-md' : 'text-gray-400'}`}
                                                      >
                                                          Proaktiv
                                                      </button>
                                                  </div>
                                              </div>
                                         </div>

                                         {/* Process Specific Documents */}
                                         <KnowledgeManager 
                                            title="Prozess-Spezifische Dokumente"
                                            description="Laden Sie hier PDFs hoch, die NUR für diesen Prozess relevant sind (z.B. Zollformulare für Pakete)."
                                            documents={settings.processes[selectedProcessId].documents}
                                            onAdd={(doc) => addProcessDocument(selectedProcessId, doc)}
                                            onRemove={(id) => removeProcessDocument(selectedProcessId, id)}
                                         />

                                         <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Zusätzliche Instruktionen</label>
                                            <textarea 
                                                value={settings.processes[selectedProcessId].customPrompt}
                                                onChange={(e) => updateProcessConfig(selectedProcessId, { customPrompt: e.target.value })}
                                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#FFCC00] focus:ring-4 focus:ring-[#FFCC00]/10 outline-none min-h-[120px] text-sm leading-relaxed resize-none shadow-inner"
                                                placeholder="Spezifische Anweisungen für diesen Prozess..."
                                            />
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
