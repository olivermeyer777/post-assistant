
import React, { useState, useEffect } from 'react';
import { Language, Message } from './types';
import { TRANSLATIONS } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { LanguageBar } from './components/LanguageBar';
import { ChatBox } from './components/ChatBox';
import { SelfServiceView } from './components/SelfServiceView';
import { useTTS } from './hooks/useTTS';
import { triggerUnbluVideoCall } from './utils/unbluIntegration';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- ICONS ---

const SwissPostLogo = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
    <rect width="100" height="100" fill="#FFCC00"/>
    <path d="M38 34H29V21H21V34H8V42H21V55H29V42H38V34Z" fill="#FF0000"/>
    <path d="M52 21H70C82.1503 21 92 30.8497 92 43C92 55.1503 82.1503 65 70 65H61V79H52V21ZM61 30V56H70C77.1797 56 83 50.1797 83 43C83 35.8203 77.1797 30 70 30H61Z" fill="black"/>
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

// Button Icons
const PacketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const LetterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
    <line x1="2" x2="22" y1="10" y2="10"></line>
  </svg>
);

const TrackingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <line x1="3.29" y1="7" x2="12" y2="12"></line>
    <line x1="12" y1="12" x2="20.71" y2="7"></line>
    <line x1="12" y1="22" x2="12" y2="12"></line>
    <circle cx="18.5" cy="18.5" r="2.5" className="fill-white stroke-gray-900" />
    <line x1="20.5" y1="20.5" x2="22" y2="22" />
  </svg>
);

const VideoCallIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"></path>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
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
  const [selfServiceMode, setSelfServiceMode] = useState<'packet' | 'letter' | 'payment' | 'tracking'>('packet');
  const [scrolled, setScrolled] = useState(false);
  const [isVideoCallLoading, setIsVideoCallLoading] = useState(false);
  
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

  // Initial Welcome Message
  useEffect(() => {
      // Only add if messages are empty
      if (messages.length === 0) {
          setMessages([{ id: generateId(), sender: 'assistant', text: t.ui.welcomeChat }]);
      }
  }, [t.ui.welcomeChat]); // Re-run when language changes to update greeting? 
  // Actually better to only do it once or update existing ID. For now simple re-add if empty is fine.

  // --- Logic ---

  const handleSelfServiceClick = (mode: 'packet' | 'letter' | 'payment' | 'tracking') => {
    setSelfServiceMode(mode);
    setCurrentView('self-service');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoClick = async () => {
    if (isVideoCallLoading) return;
    setIsVideoCallLoading(true);
    cancelTTS();
    try {
        await triggerUnbluVideoCall();
        // We don't set isVideoCallLoading false immediately as Unblu might take a second to appear
        setTimeout(() => setIsVideoCallLoading(false), 2000);
    } catch (e) {
        console.error("Video call failed", e);
        setGlobalError(t.ui.errorGeneric);
        setIsVideoCallLoading(false);
    }
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
    setIsChatOpen(true); // Ensure open
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

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50/50 selection:bg-yellow-200 pb-32">
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
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-white bg-gray-900 hover:bg-black hover:scale-[1.02] transition-all flex items-center gap-4 shadow-lg group/btn"
                         >
                           <PacketIcon />
                           <span>{t.tiles.self.btnPacket}</span>
                         </button>

                         {/* Letter */}
                         <button 
                           onClick={() => handleSelfServiceClick('letter')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-white bg-gray-900 hover:bg-black hover:scale-[1.02] transition-all flex items-center gap-4 shadow-lg group/btn"
                         >
                           <LetterIcon />
                           <span>{t.tiles.self.btnLetter}</span>
                         </button>
                         
                         {/* Payment */}
                         <button 
                           onClick={() => handleSelfServiceClick('payment')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-white bg-gray-900 hover:bg-black hover:scale-[1.02] transition-all flex items-center gap-4 shadow-lg group/btn"
                         >
                           <CreditCardIcon />
                           <span>{t.tiles.self.btnPayment}</span>
                         </button>

                         {/* Tracking */}
                         <button 
                           onClick={() => handleSelfServiceClick('tracking')}
                           className="w-full py-4 px-6 rounded-2xl text-left font-bold text-white bg-gray-900 hover:bg-black hover:scale-[1.02] transition-all flex items-center gap-4 shadow-lg group/btn"
                         >
                           <TrackingIcon />
                           <span>{t.tiles.self.btnTracking}</span>
                         </button>
                    </div>
                  </div>
                </div>

                {/* Video Tile - UNBLU */}
                <button 
                  onClick={handleVideoClick}
                  disabled={isVideoCallLoading}
                  className="group bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white hover:border-black flex flex-col text-left transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition-transform duration-300">
                     <VideoIcon />
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-gray-900">{t.tiles.video.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-sm mb-8 flex-1">
                    {t.tiles.video.desc}
                  </p>
                  <div className="w-full py-4 px-6 rounded-2xl text-center font-bold text-white bg-gray-900 hover:bg-black hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3">
                    {isVideoCallLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <VideoCallIcon />
                    )}
                    <span>{isVideoCallLoading ? "Lade..." : t.tiles.video.btnText}</span>
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
            currentLang={currentLang} 
          />
        )}
      </main>

      {/* Floating Elements */}
      
      {/* Standard Chat */}
      <ChatBox 
          isOpen={true} // Always mounted but toggled by minimize state
          isMinimized={isChatMinimized}
          setMinimized={setIsChatMinimized}
          messages={messages}
          onSendMessage={handleSendMessage}
          isThinking={isThinking}
          t={t}
          isVoiceActive={false} // No global voice anymore
          isSoundEnabled={isSoundEnabled}
          onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
          currentLang={currentLang}
      />
      
      {/* Chat Bubble Trigger (Only visible when minimized) */}
      {isChatMinimized && (
         <button 
           onClick={() => setIsChatMinimized(false)}
           className="fixed right-6 bottom-24 w-14 h-14 bg-[#FFCC00] rounded-full shadow-xl flex items-center justify-center text-gray-900 z-[990] hover:scale-110 transition-transform"
         >
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
             </svg>
         </button>
      )}

      <LanguageBar currentLang={currentLang} setLanguage={setCurrentLang} />
    </div>
  );
};

export default App;
