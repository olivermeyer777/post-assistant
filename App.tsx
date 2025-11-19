
import React, { useState, useEffect } from 'react';
import { Language, Message } from './types';
import { TRANSLATIONS } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { LanguageBar } from './components/LanguageBar';
import { ChatBox } from './components/ChatBox';
import { OracleView } from './components/OracleView';
import { VoiceControl } from './components/VoiceControl';
import { useLiveGemini } from './hooks/useLiveGemini';
import { useTTS } from './hooks/useTTS';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// SVG Icons
const SwissPostLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Die Post Logo">
    <title>Die Post</title>
    <rect width="100" height="100" fill="#FFCC00"/>
    {/* Red Cross */}
    <path d="M44 39V27H32V39H20V51H32V63H44V51H56V39H44Z" fill="#FF0000"/>
    {/* Black P */}
    <path fillRule="evenodd" clipRule="evenodd" d="M62 27H78C86.8 27 94 32.4 94 39C94 45.6 86.8 51 78 51H72V63H62V27ZM72 43H78C81.3 43 84 41.2 84 39C84 36.8 81.3 35 78 35H72V43Z" fill="black"/>
  </svg>
);

const AssistantIcon = () => (
  <svg className="w-10 h-10 mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const ServiceIcon = () => (
  <svg className="w-10 h-10 mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-10 h-10 mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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


const App: React.FC = () => {
  // --- State ---
  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [currentView, setCurrentView] = useState<'home' | 'oracle'>('home');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // Dynamic Buttons for Oracle View
  const [oracleButtons, setOracleButtons] = useState<string[]>([
    "Paket verfolgen",
    "Nachsendeauftrag",
    "Filiale finden"
  ]);

  const t = TRANSLATIONS[currentLang];

  // Hooks
  const { speak, cancel: cancelTTS } = useTTS();

  // --- Effects ---
  
  // Initialize chat with welcome message when Oracle view is opened for the first time
  useEffect(() => {
    if (currentView === 'oracle' && messages.length === 0) {
      const msgText = t.ui.welcomeChat;
      setMessages([{
        id: generateId(),
        sender: 'assistant',
        text: msgText
      }]);
      
      if (isSoundEnabled) {
        speak(msgText, currentLang);
      }
    }
  }, [currentView, messages.length, t.ui.welcomeChat, isSoundEnabled, currentLang, speak]);

  // Update document title based on language
  useEffect(() => {
    document.title = `${t.topTitle} – Schweizer Post`;
  }, [t.topTitle]);

  // Stop TTS when navigating away from oracle or closing chat
  useEffect(() => {
    if (!isChatOpen && currentView !== 'oracle') {
        cancelTTS();
    }
  }, [isChatOpen, currentView, cancelTTS]);

  // --- Logic ---

  const extractButtonsFromReply = (text: string): string[] | null => {
    const lines = text.split("\n");
    for (const line of lines) {
      const match = line.match(/BUTTONS:(.*)/i);
      if (match) {
        return match[1].split("|").map((s) => s.trim()).filter(Boolean);
      }
    }
    return null;
  };

  const cleanReplyText = (text: string): string => {
    return text.replace(/BUTTONS:.*$/im, '').trim();
  };

  const handleSendMessage = async (text: string) => {
    // Cancel any existing speech when new interaction starts
    cancelTTS();

    // 1. Add User Message
    const userMsg: Message = { id: generateId(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    
    // 2. Ensure chat is visible
    setIsChatMinimized(false); 
    setIsThinking(true);
    setGlobalError(null);

    // 3. Call API
    try {
      const rawReply = await sendMessageToGemini(text, currentLang);
      
      // 4. Process Reply
      const newButtons = extractButtonsFromReply(rawReply);
      const cleanText = cleanReplyText(rawReply);

      setIsThinking(false);
      
      // 5. Update State
      setMessages(prev => [...prev, { id: generateId(), sender: 'assistant', text: cleanText }]);
      if (newButtons && newButtons.length > 0) {
        setOracleButtons(newButtons);
      }

      // 6. Speak if enabled (and not using Live Voice mode, which handles its own audio)
      if (isSoundEnabled) {
          speak(cleanText, currentLang);
      }

    } catch (error) {
      console.error("Message sending failed", error);
      setIsThinking(false);
      
      // Show error in chat
      setMessages(prev => [...prev, { 
        id: generateId(), 
        sender: 'assistant', 
        text: t.ui.errorGeneric 
      }]);
      
      // Also show global banner for visibility
      setGlobalError(t.ui.errorGeneric);
    }
  };

  const navigateToOracle = () => {
    setCurrentView('oracle');
    setIsChatOpen(true);
    setIsChatMinimized(true); // Start minimized to show buttons first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset buttons to defaults if empty or contextual
    setOracleButtons(["Paket verfolgen", "Nachsendeauftrag", "Filiale finden"]);
  };

  const navigateToHome = () => {
    cancelTTS();
    setCurrentView('home');
    setIsChatOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextClick = () => {
    handleSendMessage("[NEXT]");
  };

  // --- Voice Hook Integration ---
  const { isConnected, isSpeaking, connect, disconnect, error: liveError } = useLiveGemini({
    onConnect: () => {
      // Cancel standard TTS when voice connects
      cancelTTS();
      
      // Open Chat behind microphone when voice connects
      setIsChatOpen(true);
      setIsChatMinimized(false);
      setGlobalError(null);
    },
    onNavigateOracle: () => {
      console.log("Voice Command: Navigate Oracle");
      navigateToOracle();
      setIsChatMinimized(false);
    },
    onNavigateHome: () => {
      console.log("Voice Command: Navigate Home");
      navigateToHome();
    },
    onChangeLanguage: (lang) => {
      console.log("Voice Command: Set Lang", lang);
      setCurrentLang(lang);
    },
    onMessageUpdate: (text, sender) => {
        // Add transcribed message to chat
        setMessages(prev => [...prev, { id: generateId(), sender, text }]);
        setIsChatOpen(true);
        setIsChatMinimized(false);
    }
  });

  // Map live errors to UI messages
  useEffect(() => {
    if (liveError) {
      if (liveError === 'microphone') {
        setGlobalError(t.ui.errorMicrophone);
      } else {
        setGlobalError(t.ui.errorGeneric);
      }
    }
  }, [liveError, t.ui]);

  const handleVoiceToggle = () => {
    setGlobalError(null);
    if (isConnected) {
        disconnect();
    } else {
        // Ensure we don't have double speech
        cancelTTS(); 
        connect(currentLang);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50 selection:bg-yellow-200">
      {/* Modern Header */}
      <header className="bg-[#FFCC00] px-6 py-4 flex items-center gap-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SwissPostLogo />
          <div className="h-6 w-px bg-black/10 mx-1"></div>
          <div className="font-bold text-xl tracking-tight text-gray-900">{t.topTitle}</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 mb-24 px-4 sm:px-6">
        
        {globalError && (
          <ErrorBanner message={globalError} onClose={() => setGlobalError(null)} />
        )}

        {currentView === 'home' && (
          <div id="home-view" className="animate-fade-in space-y-8">
            {/* Modern Hero */}
            <section className="bg-white rounded-3xl p-10 md:p-14 shadow-xl shadow-black/5 text-center relative overflow-hidden border border-white/50">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-200"></div>
               <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{t.pageTitle}</h1>
               <p className="text-gray-500 max-w-xl mx-auto text-lg">
                 {currentLang === 'de' ? 'Ihr persönlicher Zugang zu allen Postdienstleistungen.' : 'Your personal gateway to all postal services.'}
               </p>
            </section>

            {/* Tiles Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assistant Tile */}
                <button 
                  onClick={navigateToOracle}
                  className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left"
                >
                  <div className="p-4 bg-yellow-50 rounded-2xl mb-6 group-hover:bg-yellow-100 transition-colors">
                    <AssistantIcon />
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-gray-900">{t.tiles.orakel.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-sm mb-8">
                    {t.tiles.orakel.desc}
                  </p>
                  <div className="mt-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-full group-hover:bg-black transition-colors w-full">
                    {t.tiles.orakel.btnText}
                  </div>
                </button>

                {/* Self-Service Tile */}
                <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="p-4 bg-yellow-50 rounded-2xl mb-6 group-hover:bg-yellow-100 transition-colors">
                    <ServiceIcon />
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-gray-900">{t.tiles.self.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-sm mb-8">
                    {t.tiles.self.desc}
                  </p>
                  <div className="mt-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-gray-900 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors w-full">
                    {t.tiles.self.btnText}
                  </div>
                </div>

                {/* Video Tile */}
                <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="p-4 bg-yellow-50 rounded-2xl mb-6 group-hover:bg-yellow-100 transition-colors">
                     <VideoIcon />
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-gray-900">{t.tiles.video.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-sm mb-8">
                    {t.tiles.video.desc}
                  </p>
                  <div className="mt-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-gray-900 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors w-full">
                    {t.tiles.video.btnText}
                  </div>
                </div>
            </section>
          </div>
        )}

        {currentView === 'oracle' && (
          <OracleView 
            t={t}
            buttons={oracleButtons}
            onButtonClick={handleSendMessage}
            onBack={navigateToHome}
            onNext={handleNextClick}
          />
        )}
      </main>

      {/* Floating Elements */}
      <ChatBox 
        isOpen={isChatOpen}
        isMinimized={isChatMinimized}
        setMinimized={setIsChatMinimized}
        messages={messages}
        onSendMessage={handleSendMessage}
        isThinking={isThinking}
        t={t}
        isVoiceActive={isConnected}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        currentLang={currentLang}
      />

      <VoiceControl 
        isConnected={isConnected}
        isSpeaking={isSpeaking}
        onToggle={handleVoiceToggle}
      />

      <LanguageBar currentLang={currentLang} setLanguage={setCurrentLang} />
    </div>
  );
};

export default App;
