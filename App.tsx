
import React, { useState, useEffect } from 'react';
import { Language, Message } from './types';
import { TRANSLATIONS } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { LanguageBar } from './components/LanguageBar';
import { ChatBox } from './components/ChatBox';
import { SelfServiceView, SelfServiceStep } from './components/SelfServiceView'; 
import { OracleView } from './components/OracleView'; 
import { useTTS } from './hooks/useTTS';
import { AssistantTile } from './components/AssistantTile';
import { VoiceControl } from './components/VoiceControl';
import { useGeminiRealtime } from './hooks/useGeminiRealtime'; 
import { useAppSettings } from './hooks/useAppSettings'; 
import { SettingsView } from './components/SettingsView'; 

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- ICONS ---

const ServiceIcon = () => (
  <svg className="w-12 h-12 mb-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PacketIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16.5 9.4-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LetterIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="22" height="16" x="1" y="4" rx="2" ry="2" />
    <line x1="1" x2="23" y1="10" y2="10" />
  </svg>
);

const TrackingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ErrorBanner = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl shadow-lg z-[1000] flex items-center gap-3 animate-fade-in">
    <div className="bg-red-100 p-2 rounded-full">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <span className="text-sm font-medium flex-1">{message}</span>
    <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

type ViewState = 'home' | 'oracle' | 'self' | 'video';

export default function App() {
  const [isSettingsView, setIsSettingsView] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'settings') {
      setIsSettingsView(true);
    }
  }, []);

  const { settings } = useAppSettings();

  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [view, setView] = useState<ViewState>('home');
  
  const [selfServiceMode, setSelfServiceMode] = useState<'packet' | 'letter' | 'payment' | 'tracking'>('packet');
  const [selfServiceStep, setSelfServiceStep] = useState<SelfServiceStep>('destination');

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'assistant', text: TRANSLATIONS['de'].ui.welcomeChat }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[currentLang];
  const { speak, cancel: stopTTS } = useTTS();

  // --- GEMINI REALTIME HOOK ---
  const { connect: connectVoice, disconnect: disconnectVoice, isConnected: isVoiceConnected, isSpeaking: isVoiceSpeaking, isConnecting: isVoiceConnecting } = useGeminiRealtime({
      currentLang,
      settings: settings, 
      currentContext: {
          view: view,
          mode: view === 'self' ? selfServiceMode : 'N/A',
          step: view === 'self' ? selfServiceStep : 'N/A'
      },
      onNavigate: (targetView, mode) => {
          console.log("Voice navigating to:", targetView, mode);
          if (targetView === 'home') setView('home');
          if (targetView === 'self_service') {
              setView('self');
              if (mode) {
                  setSelfServiceMode(mode as any);
                  setSelfServiceStep(mode === 'tracking' ? 'trackInput' : mode === 'payment' ? 'scan' : 'destination');
              }
          }
      },
      onControlStep: (step) => {
          console.log("Voice setting step:", step);
          setSelfServiceStep(step as SelfServiceStep);
      }
  });

  // Reset steps when view changes manually
  useEffect(() => {
      if (view === 'self') {
          if (selfServiceMode === 'tracking' && selfServiceStep !== 'trackInput' && selfServiceStep !== 'trackStatus') {
              setSelfServiceStep('trackInput');
          }
      }
  }, [view, selfServiceMode]);

  useEffect(() => {
    setMessages(prev => {
      const firstMsg = prev[0];
      if (firstMsg && firstMsg.sender === 'assistant' && prev.length === 1) {
        return [{ ...firstMsg, text: t.ui.welcomeChat }];
      }
      return prev;
    });
  }, [currentLang, t.ui.welcomeChat]);

  useEffect(() => {
    if (isAccessibilityMode) {
      document.body.classList.add('accessibility-mode');
    } else {
      document.body.classList.remove('accessibility-mode');
    }
  }, [isAccessibilityMode]);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: generateId(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const aiResponse = await sendMessageToGemini(text, currentLang);
      
      const assistantMsg: Message = { 
          id: generateId(), 
          sender: 'assistant', 
          text: aiResponse.text,
          sources: aiResponse.sources
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      if (isSoundEnabled) {
        speak(aiResponse.text, currentLang);
      }

    } catch (error: any) {
      const logMsg = error instanceof Error ? error.message : String(error);
      console.error("Gemini Error:", logMsg);
      
      if (logMsg.includes("MISSING_API_KEY")) {
         setErrorMsg("API Key fehlt! Bitte erstellen Sie eine .env Datei im Projektverzeichnis.");
         setMessages(prev => [...prev, { id: generateId(), sender: 'assistant', text: "Fehler: API Key fehlt. Bitte Konfiguration prüfen." }]);
      } else {
         setErrorMsg(t.ui.errorGeneric);
         setMessages(prev => [...prev, { id: generateId(), sender: 'assistant', text: t.ui.errorGeneric }]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleSelfServiceClick = (mode: 'packet' | 'letter' | 'payment' | 'tracking') => {
    setSelfServiceMode(mode);
    if (mode === 'payment') setSelfServiceStep('scan');
    else if (mode === 'tracking') setSelfServiceStep('trackInput');
    else setSelfServiceStep('destination');

    setView('self');
  };

  if (isSettingsView) {
      return <SettingsView />;
  }

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-yellow-200">
      
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#FFCC00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-200/50 rounded-full blur-3xl"></div>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />}

      <header className="w-full bg-[#FFCC00] text-black py-6 px-8 shadow-sm z-50 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
              <span className="hidden sm:block text-xl font-bold tracking-tight opacity-90">Post Self-Service</span>
           </div>
           <div className="flex items-center gap-4">
               <a 
                 href="?view=settings" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors text-black"
                 title="Einstellungen / Demo Settings"
               >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                   </svg>
               </a>
           </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 pb-32 flex flex-col items-center">
        
        {view === 'home' && (
          <div className="w-full animate-fade-in">
            <div className="text-center mb-12 mt-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                {t.pageTitle}
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                {t.orakelViewSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              
              <div className="lg:col-span-2 group bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-black transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col gap-8 relative overflow-hidden h-full">
                 <div className="flex-1 flex flex-col items-start relative z-10">
                     <ServiceIcon />
                     <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.tiles.self.title}</h2>
                     <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-2xl">{t.tiles.self.desc}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-auto">
                     {settings.processes.packet?.isEnabled && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSelfServiceClick('packet'); }}
                            className="w-full bg-black text-white px-6 py-5 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-4 shadow-md"
                        >
                            <PacketIcon />
                            {t.tiles.self.btnPacket}
                        </button>
                     )}
                     {settings.processes.letter?.isEnabled && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSelfServiceClick('letter'); }}
                            className="w-full bg-black text-white px-6 py-5 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-4 shadow-md"
                        >
                            <LetterIcon />
                            {t.tiles.self.btnLetter}
                        </button>
                     )}
                     {settings.processes.payment?.isEnabled && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSelfServiceClick('payment'); }}
                            className="w-full bg-black text-white px-6 py-5 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-4 shadow-md"
                        >
                            <CreditCardIcon />
                            {t.tiles.self.btnPayment}
                        </button>
                     )}
                     {settings.processes.tracking?.isEnabled && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSelfServiceClick('tracking'); }}
                            className="w-full bg-black text-white px-6 py-5 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-4 shadow-md"
                        >
                            <TrackingIcon />
                            {t.tiles.self.btnTracking}
                        </button>
                     )}
                 </div>
              </div>

               <AssistantTile 
                  isConnected={isVoiceConnected} 
                  isSpeaking={isVoiceSpeaking}
                  isConnecting={isVoiceConnecting} // Pass Loading State
                  onToggle={isVoiceConnected ? disconnectVoice : connectVoice}
               />
            </div>
          </div>
        )}

        {view === 'self' && (
          <SelfServiceView 
            t={t} 
            onBack={() => setView('home')} 
            mode={selfServiceMode} 
            currentLang={currentLang}
            step={selfServiceStep}
            setStep={setSelfServiceStep}
          />
        )}

        {view === 'oracle' && (
             <OracleView 
                t={t} 
                buttons={[]} 
                onBack={() => setView('home')} 
                onNext={() => {}} 
                onButtonClick={() => {}} 
             />
        )}
      </main>

      <ChatBox
        isOpen={isChatOpen}
        isMinimized={isChatMinimized}
        setMinimized={setIsChatMinimized}
        messages={messages}
        onSendMessage={handleSendMessage}
        isThinking={isThinking}
        t={t}
        isVoiceActive={isVoiceConnected}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        currentLang={currentLang}
      />

      {/* Floating Voice Control for Non-Home Views */}
      {view !== 'home' && (
          <VoiceControl 
            isConnected={isVoiceConnected}
            isSpeaking={isVoiceSpeaking}
            isConnecting={isVoiceConnecting} // Pass Loading State
            onToggle={isVoiceConnected ? disconnectVoice : connectVoice}
          />
      )}

      <LanguageBar 
        currentLang={currentLang} 
        setLanguage={setCurrentLang} 
        isAccessibilityMode={isAccessibilityMode}
        toggleAccessibility={() => setIsAccessibilityMode(!isAccessibilityMode)}
      />
    </div>
  );
}
