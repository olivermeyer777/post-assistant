
import React, { useState, useEffect } from 'react';
import { Language, Message } from './types';
import { TRANSLATIONS } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { LanguageBar } from './components/LanguageBar';
import { ChatBox } from './components/ChatBox';
import { SelfServiceView } from './components/SelfServiceView';
import { VoiceControl } from './components/VoiceControl';
import { useLiveGemini } from './hooks/useLiveGemini';
import { useTTS } from './hooks/useTTS';
import { triggerUnbluVideoCall } from './utils/unbluIntegration';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// SVG Icons
const SwissPostLogo = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Die Post Logo">
    <rect width="100" height="100" fill="#FFCC00"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M58.836 30H76.606C84.828 30 91.5 35.046 91.5 41.225C91.5 47.404 84.828 52.45 76.606 52.45H70.45V63.675H58.836V30ZM70.45 44.037H76.606C79.712 44.037 82.229 42.775 82.229 41.225C82.229 39.675 79.712 38.413 76.606 38.413H70.45V44.037Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M39.152 28.597H27.539V39.821H16.5V51.045H27.539V62.27H39.152V51.045H50.191V39.821H39.152V28.597Z" fill="#FF0000"/>
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
  const [currentView, setCurrentView] = useState<'home' | 'self-service'>('home');
  const [selfServiceMode, setSelfServiceMode] = useState<'packet' | 'letter' | 'payment' | 'general_chat'>('packet');
  const [scrolled, setScrolled] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const t = TRANSLATIONS[currentLang];

  // Hooks
  const { speak, cancel: cancelTTS } = useTTS();

  // --- Effects ---

  // Update document title based on language
  useEffect(() => {
    document.title = `${t.topTitle} – Schweizer Post`;
  }, [t.topTitle]);

  // Scroll listener for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Logic ---

  const handleSelfServiceClick = (mode: 'packet' | 'letter' | 'payment' | 'general_chat') => {
    setSelfServiceMode(mode);
    setCurrentView('self-service');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoClick = () => {
    triggerUnbluVideoCall();
  };

  const navigateToHome = () => {
    cancelTTS();
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chat Logic
  const handleSendMessage = async (text: string) => {
    cancelTTS();
    const userMsg: Message = { id: generateId(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsChatMinimized(false); 
    setIsThinking(true);
    setGlobalError(null);

    try {
      const response = await sendMessageToGemini(text, currentLang);
      const cleanText = response.text.replace(/BUTTONS:.*$/im, '').trim();
      
      setIsThinking(false);
      setMessages(prev => [...prev, { id: generateId(), sender: 'assistant', text: cleanText }]);

      if (isSoundEnabled) {
          speak(cleanText, currentLang);
      }
    } catch (error) {
      console.error("Message sending failed", error);
      setIsThinking(false);
      setMessages(prev => [...prev, { id: generateId(), sender: 'assistant', text: t.ui.errorGeneric }]);
      setGlobalError(t.ui.errorGeneric);
    }
  };

  // --- Voice Hook Integration ---
  const { isConnected, isSpeaking, connect, disconnect, error: liveError } = useLiveGemini({
    onConnect: () => {
      cancelTTS();
      setIsChatOpen(true);
      setIsChatMinimized(false);
      setGlobalError(null);
    },
    onNavigateOracle: () => {
       setIsChatOpen(true);
       setIsChatMinimized(false);
    },
    onNavigateHome: () => {
      navigateToHome();
    },
    onChangeLanguage: (lang) => {
      setCurrentLang(lang);
    },
    onMessageUpdate: (text, sender) => {
        setMessages(prev => [...prev, { id: generateId(), sender, text }]);
        setIsChatOpen(true);
        setIsChatMinimized(false);
    }
  });

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
        cancelTTS(); 
        connect(currentLang);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50/50 selection:bg-yellow-200 pb-24">
      {/* Modern Light Header */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        {/* Branding Line */}
        <div className="h-1 w-full bg-[#FFCC00]"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={navigateToHome}>
              <div className="transform transition-transform group-hover:scale-105">
                 <SwissPostLogo />
              </div>
              <div className="flex flex-col justify-center h-12">
                  <span className="font-bold text-xl tracking-tight text-gray-900 leading-none">{t.topTitle}</span>
              </div>
            </div>

            {/* Date/Time could go here, or status indicators */}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>

      <main className="max-w-6xl mx-auto mb-12 px-4 sm:px-6 relative z-10">
        
        {globalError && (
          <ErrorBanner message={globalError} onClose={() => setGlobalError(null)} />
        )}

        {currentView === 'home' && (
          <div id="home-view" className="animate-fade-in space-y-12">
            
            {/* Modern Typography Hero (No Box) */}
            <section className="relative py-10 md:py-16">
               {/* Decorative subtle blobs */}
               <div className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
               <div className="absolute top-0 right-0 w-72 h-72 bg-gray-100/50 rounded-full blur-3xl -z-10"></div>

               <div className="max-w-3xl">
                  <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                    {t.pageTitle}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed">
                    {currentLang === 'de' 
                      ? 'Erledigen Sie Ihre Postgeschäfte einfach und schnell. Wie können wir Sie heute unterstützen?' 
                      : 'Manage your postal services simply and quickly. How can we support you today?'}
                  </p>
               </div>
            </section>

            {/* Tiles Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Self-Service Tile - Expanded (Takes 2 Columns) */}
                <div className="md:col-span-2 group bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white hover:border-black transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col text-left">
                  <div className="flex flex-col md:flex-row gap-8 h-full">
                    <div className="flex-1 flex flex-col">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition-transform duration-300">
                          <ServiceIcon />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">{t.tiles.self.title}</h2>
                        <p className="text-gray-500 leading-relaxed text-base max-w-xs">
                          {t.tiles.self.desc}
                        </p>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-3 justify-end">
                         {/* Packet */}
                         <button 
                           onClick={() => handleSelfServiceClick('packet')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-gray-900 bg-gray-50 hover:bg-black hover:text-white transition-all flex items-center justify-between group/btn"
                         >
                           <span>{t.tiles.self.btnPacket}</span>
                           <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover/btn:bg-gray-800 opacity-0 group-hover/btn:opacity-100 transition-opacity text-black group-hover/btn:text-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                           </div>
                         </button>

                         {/* Letter */}
                         <button 
                           onClick={() => handleSelfServiceClick('letter')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-gray-900 bg-gray-50 hover:bg-black hover:text-white transition-all flex items-center justify-between group/btn"
                         >
                           <span>{t.tiles.self.btnLetter}</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover/btn:bg-gray-800 opacity-0 group-hover/btn:opacity-100 transition-opacity text-black group-hover/btn:text-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                           </div>
                         </button>
                         
                         {/* Payment */}
                         <button 
                           onClick={() => handleSelfServiceClick('payment')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-gray-900 bg-gray-50 hover:bg-black hover:text-white transition-all flex items-center justify-between group/btn"
                         >
                           <span>{t.tiles.self.btnPayment}</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover/btn:bg-gray-800 opacity-0 group-hover/btn:opacity-100 transition-opacity text-black group-hover/btn:text-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                           </div>
                         </button>

                         {/* Other - Now General Chat */}
                         <button 
                           onClick={() => handleSelfServiceClick('general_chat')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-gray-900 bg-gray-50 hover:bg-black hover:text-white transition-all flex items-center justify-between group/btn"
                         >
                           <span>{t.tiles.self.btnOther}</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover/btn:bg-gray-800 opacity-0 group-hover/btn:opacity-100 transition-opacity text-black group-hover/btn:text-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                           </div>
                         </button>
                    </div>
                  </div>
                </div>

                {/* Video Tile - UNBLU */}
                <button 
                  onClick={handleVideoClick}
                  className="group bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white hover:border-black flex flex-col text-left transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition-transform duration-300">
                     <VideoIcon />
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-gray-900">{t.tiles.video.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-sm mb-8 flex-1">
                    {t.tiles.video.desc}
                  </p>
                  <div className="inline-flex items-center justify-between px-6 py-4 text-sm font-bold text-gray-900 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors w-full">
                    <span>{t.tiles.video.btnText}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                </button>
            </section>
          </div>
        )}

        {currentView === 'self-service' && (
          <SelfServiceView 
            t={t} 
            onBack={navigateToHome} 
            mode={selfServiceMode} 
            currentLang={currentLang} // Pass lang for speech
          />
        )}
      </main>

      {/* Floating Elements */}
      {selfServiceMode !== 'general_chat' && (
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
      )}

      {selfServiceMode !== 'general_chat' && (
        <VoiceControl 
            isConnected={isConnected}
            isSpeaking={isSpeaking}
            onToggle={handleVoiceToggle}
        />
      )}

      <LanguageBar currentLang={currentLang} setLanguage={setCurrentLang} />
    </div>
  );
};

export default App;
