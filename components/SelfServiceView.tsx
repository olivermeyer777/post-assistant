
import React, { useState, useEffect } from 'react';
import { TranslationData, Language, Message } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { sendMessageToGemini } from '../services/geminiService';
import { useTTS } from '../hooks/useTTS';

interface SelfServiceViewProps {
  t: TranslationData;
  onBack: () => void;
  mode?: 'packet' | 'letter' | 'payment' | 'general_chat';
  currentLang?: Language;
}

type Step = 'destination' | 'weigh' | 'addressCheck' | 'address' | 'format' | 'options' | 'extras' | 'payment' | 'success' | 'feedback' | 'scan' | 'payDetails' | 'payReceiver' | 'payConfirm' | 'paySummary';

interface ReceiverData {
  type: 'private' | 'company';
  name: string;
  street: string;
  zip: string;
  city: string;
}

export const SelfServiceView: React.FC<SelfServiceViewProps> = ({ t, onBack, mode = 'packet', currentLang = 'de' }) => {
  const [step, setStep] = useState<Step>('destination');
  const [isWeighing, setIsWeighing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // State for "Simulated Data"
  const [receiver, setReceiver] = useState<ReceiverData>({
    type: 'private',
    name: '',
    street: '',
    zip: '',
    city: ''
  });
  
  // Packet Specific
  const [shippingMethod, setShippingMethod] = useState<'economy' | 'priority' | 'express'>('economy');
  const [weightGrams, setWeightGrams] = useState<number>(7796);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Letter Specific
  const [letterFormat, setLetterFormat] = useState<'small' | 'big'>('small');
  const [letterExtras, setLetterExtras] = useState({
    registered: false,
    prepaid: false,
    formatSurcharge: false
  });
  
  // Payment Specific
  const [paymentData, setPaymentData] = useState({
    iban: 'CH97 0900 0078 3740 23',
    amount: 51.00,
    reference: '27 3840 0239 3020 1',
    receiverName: 'Max Mustermann',
    receiverCity: 'Grosshöchstetten'
  });

  // Chat / Assistant Specific
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const { isListening, startListening, stopListening } = useSpeechRecognition();
  const { speak, cancel: cancelTTS } = useTTS();

  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);

  // --- Init ---
  useEffect(() => {
    if (mode === 'payment') {
        setStep('scan');
    } else {
        setStep('destination');
    }
  }, [mode]);

  // --- Pricing Logic ---
  
  // Packet Pricing
  const getPacketPrices = (grams: number) => {
    if (grams <= 2000) {
      return { eco: 7.00, prio: 9.00 };
    } else if (grams <= 10000) {
      return { eco: 9.70, prio: 10.70 };
    } else {
      return { eco: 20.50, prio: 23.00 };
    }
  };
  
  const getLetterBasePrice = (method: 'economy' | 'priority' | 'express') => {
     switch(method) {
         case 'economy': return 1.00;
         case 'priority': return 1.20;
         case 'express': return 2.50;
     }
  };
  
  const calculateTotal = () => {
     if (mode === 'packet') {
         const prices = getPacketPrices(weightGrams);
         const base = shippingMethod === 'priority' ? prices.prio : prices.eco;
         return base + (hasSignature ? 1.50 : 0);
     } else if (mode === 'letter') {
         let total = getLetterBasePrice(shippingMethod);
         if (letterExtras.registered) total += 5.30;
         if (letterExtras.prepaid) total += 1.50;
         if (letterExtras.formatSurcharge) total += 2.00;
         return total;
     } else {
         return paymentData.amount;
     }
  };

  const totalPrice = calculateTotal();

  // Format Weight Helper
  const formatWeight = (grams: number) => {
    const kg = Math.floor(grams / 1000);
    const g = grams % 1000;
    if (kg === 0) return `${g}g`;
    return `${kg} kg ${g}g`;
  };

  // Timeout Logic for Finish Screens
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'success' || step === 'feedback') {
      timer = setTimeout(() => {
        onBack();
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [step, onBack]);

  const simulateWeighing = () => {
    setIsWeighing(true);
    const randomWeight = Math.floor(Math.random() * (30000 - 500 + 1)) + 500;
    setTimeout(() => {
      setWeightGrams(randomWeight);
      setIsWeighing(false);
      setStep('address');
    }, 2000);
  };
  
  const simulateScanning = () => {
      setIsScanning(true);
      setTimeout(() => {
          setIsScanning(false);
          setStep('payDetails');
      }, 2000);
  };

  // --- Chat Logic ---
  const handleMicClick = () => {
    if (isListening) {
        stopListening();
    } else {
        startListening(currentLang, (text, isFinal) => {
            if (isFinal) {
                handleUserQuery(text);
            }
        });
    }
  };

  const handleUserQuery = async (text: string) => {
     cancelTTS();
     setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
     setIsProcessingChat(true);
     
     try {
        const response = await sendMessageToGemini(text, currentLang);
        const cleanText = response.text.replace(/BUTTONS:.*$/im, '').trim();
        
        setChatMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            sender: 'assistant', 
            text: cleanText,
            sources: response.sources 
        }]);
        
        speak(cleanText, currentLang);
     } catch (e) {
         setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'assistant', text: t.ui.errorGeneric }]);
     } finally {
         setIsProcessingChat(false);
     }
  };

  // --- RENDER FUNCTIONS ---

  const renderProgressBar = () => {
    let stepsList: string[] = [];
    let title = "";

    if (mode === 'packet') {
        title = t.selfService.title;
        stepsList = ['destination', 'weigh', 'address', 'options', 'payment', 'success'];
    } else if (mode === 'letter') {
        title = t.selfService.titleLetter;
        stepsList = ['destination', 'addressCheck', 'address', 'format', 'options', 'extras', 'payment', 'success'];
    } else if (mode === 'payment') {
        title = t.selfService.titlePayment;
        stepsList = ['scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'payment', 'success'];
    } else {
        // General Chat
        title = t.selfService.titleChat;
        return (
             <div className="bg-white border-b border-gray-100 pt-6 px-4 md:px-8 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{title}</h1>
             </div>
        );
    }

    let currentIndex = stepsList.indexOf(step);
    if (step === 'feedback') currentIndex = stepsList.length - 1;
    if (currentIndex === -1) currentIndex = 0;

    const progressPercent = stepsList.length > 1 
        ? (currentIndex / (stepsList.length - 1)) * 100 
        : 100;

    return (
      <div className="bg-white border-b border-gray-100 pt-6 px-4 md:px-8 pb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
            {title}
        </h1>
        <div className="relative mx-2 md:mx-4">
            {/* Gray Background Track */}
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 rounded-full -translate-y-1/2"></div>
            
            {/* Yellow Progress Track */}
            <div 
                className="absolute top-1/2 left-0 h-1.5 bg-[#FFCC00] rounded-full -translate-y-1/2 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
            ></div>

            {/* Process Steps Dots */}
            {stepsList.map((_, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isFuture = idx > currentIndex;
                const position = (idx / (stepsList.length - 1)) * 100;

                return (
                    <div 
                        key={idx}
                        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-500 z-10
                            ${isFuture 
                                ? 'w-4 h-4 bg-white border-2 border-gray-200' 
                                : 'w-8 h-8 bg-[#FFCC00] border-2 border-[#FFCC00] shadow-sm'
                            }
                        `}
                        style={{ 
                            left: `${position}%`, 
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {isCompleted && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-green-800">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        )}
                        {isCurrent && (
                            <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  // --- General Chat View (Alles andere) ---
  const renderGeneralChatView = () => {
      const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
      const showIntro = chatMessages.length === 0;

      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto">
              
              {showIntro && (
                  <div className="text-center animate-fade-in mb-12">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.selfService.chat.introTitle}</h2>
                      <p className="text-gray-500 text-lg">{t.selfService.chat.introDesc}</p>
                  </div>
              )}

              {/* Result Display Area */}
              {!showIntro && (
                  <div className="w-full space-y-6 mb-8 animate-fade-in">
                      {/* Only show the last Q&A interaction for clarity in this specific view */}
                      {chatMessages.slice(-2).map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.sender === 'user' ? (
                                  <div className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl rounded-tr-none max-w-[80%] text-lg">
                                      "{msg.text}"
                                  </div>
                              ) : (
                                  <div className="bg-white border border-gray-200 shadow-lg rounded-3xl p-6 w-full relative">
                                      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                                          {msg.text}
                                      </div>
                                      
                                      {/* Sources / Grounding Chips */}
                                      {msg.sources && msg.sources.length > 0 && (
                                          <div className="mt-6 pt-6 border-t border-gray-100">
                                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.selfService.chat.sources}</div>
                                              <div className="flex flex-wrap gap-2">
                                                  {msg.sources.map((src, idx) => (
                                                      <a 
                                                        key={idx} 
                                                        href={src.uri} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-blue-600 transition-colors truncate max-w-[250px]"
                                                      >
                                                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                          <span className="truncate">{src.title}</span>
                                                      </a>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      ))}
                      {isProcessingChat && (
                           <div className="flex justify-start">
                               <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex items-center gap-3">
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                               </div>
                           </div>
                      )}
                  </div>
              )}

              {/* Mic Button Area */}
              <div className="relative mt-auto">
                  {isListening && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  )}
                  <button
                      onClick={handleMicClick}
                      disabled={isProcessingChat}
                      className={`
                        relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110
                        ${isListening ? 'bg-red-600 text-white' : (chatMessages.length > 0 ? 'bg-black text-white' : 'bg-[#FFCC00] text-gray-900 hover:bg-black hover:text-white')}
                      `}
                  >
                      {isListening ? (
                           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg> // Stop Icon
                      ) : (
                           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                      )}
                  </button>
              </div>
              
              <div className="mt-6 text-gray-400 font-medium text-sm h-6">
                  {isListening ? t.selfService.chat.listening : (chatMessages.length > 0 ? t.selfService.chat.tryAgain : "")}
              </div>
          </div>
      );
  };

  // --- Common Steps ---
  const renderDestinationView = () => (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[400px]">
      <div className="text-center max-w-lg mb-4">
         <h3 className="text-xl font-semibold text-gray-800">
            {mode === 'packet' ? t.selfService.franking.weighIntro : t.selfService.franking.destCH}
         </h3>
      </div>
      
      <button 
        onClick={() => {
            if (mode === 'packet') setStep('weigh');
            else setStep('addressCheck');
        }}
        className="w-full max-w-lg bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-4 group hover:border-black hover:bg-black hover:text-white"
      >
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 group-hover:bg-gray-800 group-hover:text-yellow-400 transition-colors">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20 6 9 17l-5-5"/>
           </svg>
        </div>
        <div className="text-left flex-1">
           <div className="font-bold text-lg group-hover:text-white">{t.selfService.franking.destCH}</div>
        </div>
        <div className="text-gray-400 group-hover:text-gray-500">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </button>

      <div className="w-full max-w-lg bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 opacity-70 flex items-center gap-4 cursor-not-allowed">
         <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"/>
               <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
         </div>
         <div className="text-left">
            <div className="font-bold text-lg text-gray-400">{t.selfService.franking.destInt}</div>
            <div className="text-xs text-red-500 mt-1 font-medium">
               {t.selfService.franking.destIntNote}
            </div>
         </div>
      </div>
    </div>
  );

  // --- Payment Steps ---
  const renderScanView = () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.selfService.payment.scanInstruction}</h2>
          
          <button 
             onClick={simulateScanning}
             className="w-64 h-64 bg-white border-2 border-gray-200 rounded-[2rem] flex flex-col items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-300 relative overflow-hidden group shadow-lg"
          >
             {isScanning ? (
                 <div className="absolute inset-0 bg-black flex items-center justify-center">
                     <div className="w-full h-0.5 bg-red-500 absolute top-0 animate-[scan_2s_infinite_linear] shadow-[0_0_15px_rgba(255,0,0,0.7)]"></div>
                     <div className="text-white font-mono animate-pulse">Scanning...</div>
                 </div>
             ) : (
                 <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-gray-800 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-white">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M7 7h3"></path>
                            <path d="M14 7h3"></path>
                            <path d="M7 17h3"></path>
                            <path d="M14 17h3"></path>
                        </svg>
                    </div>
                    <span className="font-bold text-lg">{t.selfService.payment.scanAction}</span>
                    <span className="text-xs mt-2 opacity-60">Klicken zum Simulieren</span>
                 </div>
             )}
          </button>
      </div>
  );

  const renderPaymentDetailsView = () => (
      <div className="flex flex-col items-center gap-8 min-h-[400px] justify-center">
          <h2 className="text-2xl font-bold text-gray-900 text-center">{t.selfService.payment.detailsIntro}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
             <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:border-black transition-colors group">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.selfService.payment.fieldIban}</div>
                 <div className="font-mono text-lg font-bold text-gray-900 mb-2 group-hover:text-black">{paymentData.iban}</div>
             </div>
             
             <div className="bg-white border-2 border-[#FFCC00] rounded-2xl p-8 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFCC00]"></div>
                 <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-3">{t.selfService.payment.fieldAmount}</div>
                 <div className="font-mono text-3xl font-bold text-gray-900 mb-2">CHF {paymentData.amount.toFixed(2)}</div>
             </div>
             
             <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:border-black transition-colors group">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.selfService.payment.fieldRef}</div>
                 <div className="font-mono text-sm font-medium text-gray-600 break-all group-hover:text-black">{paymentData.reference}</div>
             </div>
          </div>
      </div>
  );

  const renderPaymentReceiverView = () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.selfService.payment.receiverTitle}</h2>
          <div className="bg-white border-2 border-gray-200 rounded-[2rem] p-10 shadow-xl w-full max-w-xl relative">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center absolute -top-8 left-1/2 -translate-x-1/2 text-white shadow-lg border-4 border-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className="mt-6">
                 <div className="text-3xl font-bold text-gray-900 mb-2">{paymentData.receiverName}</div>
                 <div className="text-xl text-gray-500 font-medium">{paymentData.receiverCity}</div>
              </div>
          </div>
      </div>
  );

  const renderPaymentConfirmView = () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-10">
          <h2 className="text-3xl font-bold text-gray-900">{t.selfService.payment.confirmQuestion}</h2>
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
              <button
                  onClick={() => setStep('paySummary')} 
                  className="flex-1 group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:bg-black hover:border-black transition-all duration-300 active:scale-95"
              >
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className="font-bold text-xl text-gray-900 group-hover:text-white whitespace-pre-line">{t.selfService.payment.confirmYes}</div>
              </button>

              <button
                  onClick={() => setStep('payDetails')}
                  className="flex-1 group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:bg-black hover:border-black transition-all duration-300 active:scale-95"
              >
                   <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                   </div>
                   <div className="font-bold text-xl text-gray-900 group-hover:text-white whitespace-pre-line">{t.selfService.payment.confirmNo}</div>
              </button>
          </div>
      </div>
  );

  const renderPaymentSummaryView = () => (
       <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.selfService.payment.summaryTitle}</h2>
          
          <div className="text-5xl font-bold text-gray-900 mb-2">CHF {paymentData.amount.toFixed(2)}</div>
          <div className="text-gray-500 font-medium">{t.selfService.payment.summaryAccount}</div>
          <div className="font-mono bg-gray-100 px-4 py-2 rounded-lg text-lg">{paymentData.iban}</div>
          
          <div className="mt-6 pt-6 border-t border-gray-100 w-full max-w-md">
             <div className="font-bold text-lg text-gray-900">Empfänger</div>
             <div className="text-gray-600">{paymentData.receiverName}, {paymentData.receiverCity}</div>
          </div>
       </div>
  );

  // --- Existing Packet/Letter Steps (simplified ref) ---
  const renderWeighView = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
       {isWeighing ? (
         <div className="animate-pulse flex flex-col items-center">
           <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
             <svg className="w-10 h-10 text-yellow-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
           </div>
           <h2 className="text-2xl font-bold text-gray-900">{t.selfService.franking.weighing}</h2>
         </div>
       ) : (
         <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.selfService.franking.weighAction}</h2>
            <p className="text-gray-500 mb-8">{t.selfService.franking.weighIntro}</p>
            
            <button 
               onClick={simulateWeighing}
               className="group relative w-64 h-64 bg-white rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-black hover:bg-black transition-all duration-300"
            >
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-black group-hover:bg-white transition-colors mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                     <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                     <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
               </div>
               <span className="font-semibold text-gray-900 group-hover:text-white">{t.selfService.franking.weighAction}</span>
               <span className="text-xs text-gray-400 mt-1 group-hover:text-gray-400">Klicken zum Simulieren</span>
            </button>
         </>
       )}
    </div>
  );

  const renderAddressCheckView = () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-10">
          <h2 className="text-2xl font-bold text-gray-900">{t.selfService.letter.addressCheckQuestion}</h2>
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
              <button
                  onClick={() => setStep('format')} 
                  className="flex-1 group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:bg-black hover:border-black transition-all duration-300 active:scale-95"
              >
                   <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className="font-bold text-xl text-gray-900 group-hover:text-white whitespace-pre-line">{t.selfService.letter.addressCheckYes}</div>
              </button>
              <button
                  onClick={() => setStep('address')}
                  className="flex-1 group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:bg-black hover:border-black transition-all duration-300 active:scale-95"
              >
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                  <div className="font-bold text-xl text-gray-900 group-hover:text-white whitespace-pre-line">{t.selfService.letter.addressCheckNo}</div>
              </button>
          </div>
      </div>
  );

  const renderFormatView = () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-8">
          <h2 className="text-2xl font-bold text-gray-900">{t.selfService.letter.formatQuestion}</h2>
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
              <button
                  onClick={() => { setLetterFormat('small'); setStep('options'); }}
                  className={`flex-1 rounded-2xl p-8 shadow-sm transition-all active:scale-95 flex flex-col items-center gap-4 border-2 group relative overflow-hidden
                    ${letterFormat === 'small' ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'}`}
              >
                  {letterFormat === 'small' && <div className="absolute top-4 right-4 text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                  <div className="text-left w-full">
                       <span className={`block font-bold text-xl mb-2 ${letterFormat === 'small' ? 'text-white' : 'text-gray-900'}`}>{t.selfService.letter.formatSmall}</span>
                       <span className={`block text-sm ${letterFormat === 'small' ? 'text-gray-400' : 'text-gray-500'}`}>{t.selfService.letter.formatSmallDesc}</span>
                  </div>
              </button>

              <button
                  onClick={() => { setLetterFormat('big'); setStep('options'); }}
                  className={`flex-1 rounded-2xl p-8 shadow-sm transition-all active:scale-95 flex flex-col items-center gap-4 border-2 group relative overflow-hidden
                    ${letterFormat === 'big' ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'}`}
              >
                   {letterFormat === 'big' && <div className="absolute top-4 right-4 text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                   <div className="text-left w-full">
                       <span className={`block font-bold text-xl mb-2 ${letterFormat === 'big' ? 'text-white' : 'text-gray-900'}`}>{t.selfService.letter.formatBig}</span>
                       <span className={`block text-sm ${letterFormat === 'big' ? 'text-gray-400' : 'text-gray-500'}`}>{t.selfService.letter.formatBigDesc}</span>
                  </div>
              </button>
          </div>
      </div>
  );

  const renderAddressView = () => (
    <div className="flex flex-col gap-6 min-h-[400px]">
       {mode === 'packet' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="text-green-800 font-medium text-sm">{t.selfService.franking.detectedLabel}: <span className="font-bold">{formatWeight(weightGrams)}</span></span>
        </div>
       )}

       <h2 className="text-xl font-bold text-gray-900">{t.selfService.franking.addressReceiver}</h2>
       
       <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full max-w-md self-center mb-2">
          <button 
            onClick={() => setReceiver({...receiver, type: 'private'})}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${receiver.type === 'private' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.selfService.franking.isPrivate}
          </button>
          <button 
            onClick={() => setReceiver({...receiver, type: 'company'})}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${receiver.type === 'company' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.selfService.franking.isCompany}
          </button>
       </div>

       <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.name}</label>
             <input 
                type="text" 
                value={receiver.name}
                onChange={(e) => setReceiver(prev => ({...prev, name: e.target.value}))}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-0 focus:border-black outline-none transition-all"
                placeholder="Muster Hans"
             />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1 space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.zip}</label>
                 <input 
                    type="text" 
                    value={receiver.zip}
                    onChange={(e) => setReceiver(prev => ({...prev, zip: e.target.value}))}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-0 focus:border-black outline-none transition-all"
                    placeholder="3000"
                 />
             </div>
             <div className="col-span-2 space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.city}</label>
                 <input 
                    type="text" 
                    value={receiver.city}
                    onChange={(e) => setReceiver(prev => ({...prev, city: e.target.value}))}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-0 focus:border-black outline-none transition-all"
                    placeholder="Bern"
                 />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.street}</label>
             <input 
                type="text" 
                value={receiver.street}
                onChange={(e) => setReceiver(prev => ({...prev, street: e.target.value}))}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-0 focus:border-black outline-none transition-all"
                placeholder="Musterstrasse 1"
             />
          </div>
       </div>
    </div>
  );

  const renderOptionsView = () => (
    <div className="flex flex-col gap-8 min-h-[400px]">
       <div className="flex justify-center mb-4 mt-4">
           {mode === 'packet' ? (
               <div className="bg-white rounded-full w-48 h-48 shadow-xl border-4 border-[#FFCC00] flex flex-col items-center justify-center transform transition-all hover:scale-105 relative">
                    <div className="absolute -top-2 w-4 h-8 bg-[#FFCC00] rounded-full opacity-50"></div>
                    <span className="text-4xl mb-2">⚖️</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.selfService.franking.weight}</span>
                    <span className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{formatWeight(weightGrams)}</span>
               </div>
           ) : (
               <h2 className="text-2xl font-bold text-gray-900">{t.selfService.letter.shippingQuestion}</h2>
           )}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mode === 'packet' && (
             <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 uppercase text-xs tracking-wider">{t.selfService.franking.addressReceiver}</h3>
                <div className="text-gray-800 font-medium leading-relaxed text-lg">
                    {receiver.name || "Muster Hans"}<br/>
                    {receiver.street || "Strasse 1"}<br/>
                    {receiver.zip} {receiver.city}
                </div>
             </div>
          )}

          <div className={mode === 'packet' ? "space-y-4" : "col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4"}>
              <button 
                onClick={() => setShippingMethod('economy')}
                className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-center transition-all cursor-pointer group relative overflow-hidden
                    ${shippingMethod === 'economy' ? 'border-[#FFCC00] bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-400'} 
                    ${mode === 'letter' ? 'text-center' : 'w-full'}`}
              >
                 {shippingMethod === 'economy' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFCC00]"></div>}
                 <div className={mode === 'letter' ? 'w-full text-center' : 'text-left'}>
                    <div className="font-bold text-lg text-gray-900">{mode === 'packet' ? t.selfService.franking.economy : t.selfService.letter.bPost}</div>
                    <div className="text-sm text-gray-500 font-medium mt-0.5">{t.selfService.franking.duration2days}</div>
                 </div>
                 <div className="font-bold text-xl mt-2 md:mt-0 bg-white/50 px-3 py-1 rounded-lg">CHF {mode === 'packet' ? getPacketPrices(weightGrams).eco.toFixed(2) : getLetterBasePrice('economy').toFixed(2)}</div>
              </button>

              <button 
                onClick={() => setShippingMethod('priority')}
                 className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-center transition-all cursor-pointer group relative overflow-hidden
                    ${shippingMethod === 'priority' ? 'border-[#FFCC00] bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-400'} 
                    ${mode === 'letter' ? 'text-center' : 'w-full'}`}
              >
                 {shippingMethod === 'priority' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFCC00]"></div>}
                 <div className={mode === 'letter' ? 'w-full text-center' : 'text-left'}>
                    <div className="font-bold text-lg text-gray-900">{mode === 'packet' ? t.selfService.franking.priority : t.selfService.letter.aPost}</div>
                    <div className="text-sm text-gray-500 font-medium mt-0.5">{t.selfService.franking.duration1day}</div>
                 </div>
                 <div className="font-bold text-xl mt-2 md:mt-0 bg-white/50 px-3 py-1 rounded-lg">CHF {mode === 'packet' ? getPacketPrices(weightGrams).prio.toFixed(2) : getLetterBasePrice('priority').toFixed(2)}</div>
              </button>
              
              {mode === 'letter' && (
                  <button 
                    onClick={() => setShippingMethod('express')}
                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between items-center transition-all cursor-pointer group relative overflow-hidden
                        ${shippingMethod === 'express' ? 'border-[#FFCC00] bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-400'} 
                        text-center`}
                  >
                     {shippingMethod === 'express' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFCC00]"></div>}
                     <div className="w-full text-center">
                        <div className="font-bold text-lg text-gray-900">{t.selfService.letter.express}</div>
                        <div className="text-sm text-gray-500 font-medium mt-0.5">{t.selfService.franking.duration1day}</div>
                     </div>
                     <div className="font-bold text-xl mt-2 bg-white/50 px-3 py-1 rounded-lg">CHF {getLetterBasePrice('express').toFixed(2)}</div>
                  </button>
              )}

              {mode === 'packet' && (
                  <div className="pt-4 border-t border-gray-100 mt-4">
                      <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">{t.selfService.franking.extras}</h3>
                      <button 
                        onClick={() => setHasSignature(!hasSignature)}
                        className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all ${hasSignature ? 'border-black bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${hasSignature ? 'bg-white border-white text-black' : 'border-gray-300 bg-white'}`}>
                               {hasSignature && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <span className="font-bold text-lg">{t.selfService.franking.signature}</span>
                         </div>
                         <span className="font-medium">CHF 1.50</span>
                      </button>
                  </div>
              )}
          </div>
       </div>
       
       {mode === 'packet' && (
          <div className="bg-black text-white p-6 rounded-2xl mt-2 flex justify-between items-center shadow-lg">
             <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">{t.selfService.franking.total}</span>
             <span className="text-3xl font-bold">CHF {totalPrice.toFixed(2)}</span>
          </div>
       )}
    </div>
  );

  const renderExtrasView = () => (
     <div className="flex flex-col gap-8 min-h-[400px]">
        <h2 className="text-xl font-bold text-gray-900 text-center">{t.selfService.letter.extrasQuestion}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
               onClick={() => setLetterExtras(p => ({...p, registered: !p.registered}))}
               className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer
                  ${letterExtras.registered ? 'bg-black border-black text-white scale-[1.02] shadow-lg' : 'bg-white border-gray-200 text-gray-900 hover:border-black hover:bg-gray-50'}`}
            >
               <span className="font-bold text-xl">{t.selfService.letter.extraRegistered}</span>
               <span className={`text-sm font-medium ${letterExtras.registered ? 'text-gray-400' : 'text-gray-500'}`}>CHF 5.30</span>
            </button>

            <button 
               onClick={() => setLetterExtras(p => ({...p, prepaid: !p.prepaid}))}
               className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer
                  ${letterExtras.prepaid ? 'bg-black border-black text-white scale-[1.02] shadow-lg' : 'bg-white border-gray-200 text-gray-900 hover:border-black hover:bg-gray-50'}`}
            >
               <span className="font-bold text-xl">{t.selfService.letter.extraPrepaid}</span>
               <span className={`text-sm font-medium ${letterExtras.prepaid ? 'text-gray-400' : 'text-gray-500'}`}>CHF 1.50</span>
            </button>

             <button 
               onClick={() => setLetterExtras(p => ({...p, formatSurcharge: !p.formatSurcharge}))}
               className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer
                  ${letterExtras.formatSurcharge ? 'bg-black border-black text-white scale-[1.02] shadow-lg' : 'bg-white border-gray-200 text-gray-900 hover:border-black hover:bg-gray-50'}`}
            >
               <span className="font-bold text-xl">{t.selfService.letter.extraFormat}</span>
               <span className={`text-sm font-medium ${letterExtras.formatSurcharge ? 'text-gray-400' : 'text-gray-500'}`}>CHF 2.00</span>
            </button>
        </div>
     </div>
  );

  const renderPaymentView = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.selfService.franking.payTerminal}</h2>
        
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg my-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500"></div>
            
            {mode === 'letter' && (
                <div className="mb-6 text-left text-sm text-gray-600 space-y-3 border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-lg">{t.selfService.letter.shippingTitle}</span>
                        <span className="font-mono font-bold">CHF {getLetterBasePrice(shippingMethod).toFixed(2)}</span>
                    </div>
                    {letterExtras.registered && <div className="flex justify-between"><span>{t.selfService.letter.extraRegistered}</span><span className="font-mono">CHF 5.30</span></div>}
                    {letterExtras.prepaid && <div className="flex justify-between"><span>{t.selfService.letter.extraPrepaid}</span><span className="font-mono">CHF 1.50</span></div>}
                    {letterExtras.formatSurcharge && <div className="flex justify-between"><span>{t.selfService.letter.extraFormat}</span><span className="font-mono">CHF 2.00</span></div>}
                </div>
            )}

            {mode === 'payment' && (
                <div className="mb-6 text-left space-y-2 border-b border-gray-100 pb-6">
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                        <span>{t.selfService.payment.summaryTitle}</span>
                        <span className="font-mono">CHF {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate font-mono">Ref: {paymentData.reference}</div>
                </div>
            )}

            <div className="w-32 h-48 mx-auto bg-gray-800 rounded-xl border-4 border-gray-700 shadow-inner flex flex-col items-center p-4 mb-6">
               <div className="w-full h-20 bg-white/10 rounded mb-4 flex items-center justify-center text-white font-mono text-lg tracking-widest">
                  CHF {totalPrice.toFixed(2)}
               </div>
               <div className="grid grid-cols-3 gap-2 w-full">
                  {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="w-full h-2 bg-gray-600 rounded-sm"></div>)}
               </div>
            </div>
            <div className="flex justify-center gap-4 opacity-60 grayscale">
               <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">VISA</div>
               <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">MC</div>
               <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">PF</div>
            </div>
        </div>

        <button
            onClick={() => setStep('success')}
            className="w-full max-w-sm py-4 rounded-2xl font-bold text-white bg-black hover:bg-gray-900 shadow-lg shadow-gray-900/20 transition-all active:scale-95 text-lg flex items-center justify-center gap-3"
        >
           <span>{t.selfService.franking.payButton}</span>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
    </div>
  );

  const renderSuccessView = () => (
     <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-8 shadow-green-100 shadow-xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-12">{t.selfService.franking.successTitle}</h2>

        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 max-w-xl w-full shadow-sm">
           <div className="space-y-6 text-left">
              <div className="flex items-start gap-5">
                 <div className="w-10 h-10 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                 <div className="pt-2 text-gray-900 font-medium text-lg">{t.selfService.franking.instruction1}</div>
              </div>
              <div className="flex items-start gap-5">
                 <div className="w-10 h-10 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                 <div className="pt-2 text-gray-900 font-medium text-lg">{t.selfService.franking.instruction2}</div>
              </div>
              <div className="flex items-start gap-5">
                 <div className="w-10 h-10 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                 <div className="pt-2 text-gray-900 font-medium text-lg">{t.selfService.franking.instruction3}</div>
              </div>
           </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-lg">
           <h4 className="text-gray-900 font-bold mb-4">{t.selfService.franking.feedbackTitle}</h4>
           {feedbackScore !== null ? (
             <div className="text-green-600 font-bold text-xl animate-fade-in">
                {t.selfService.franking.feedbackThanks}
             </div>
           ) : (
             <div className="flex justify-between gap-1">
                {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                   <button 
                     key={num}
                     onClick={() => setFeedbackScore(num)}
                     className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 text-xs md:text-sm font-medium hover:bg-black hover:text-white hover:border-black transition-all"
                   >
                     {num}
                   </button>
                ))}
             </div>
           )}
           
           <div className="mt-4 text-xs text-gray-400">
             Automatische Rückkehr in 60s...
           </div>
        </div>
     </div>
  );


  return (
    <section className="mt-4 md:mt-10 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        
        {renderProgressBar()}

        <div className="p-6 md:p-10 min-h-[400px]">
            {/* Mode specific views */}
            {mode === 'general_chat' ? renderGeneralChatView() : (
                <>
                    {step === 'destination' && renderDestinationView()}
                    {step === 'weigh' && renderWeighView()}
                    {step === 'addressCheck' && renderAddressCheckView()}
                    {step === 'address' && renderAddressView()}
                    {step === 'format' && renderFormatView()}
                    {step === 'options' && renderOptionsView()}
                    {step === 'extras' && renderExtrasView()}
                    
                    {/* Payment Mode Steps */}
                    {step === 'scan' && renderScanView()}
                    {step === 'payDetails' && renderPaymentDetailsView()}
                    {step === 'payReceiver' && renderPaymentReceiverView()}
                    {step === 'payConfirm' && renderPaymentConfirmView()}
                    {step === 'paySummary' && renderPaymentSummaryView()}
                    
                    {step === 'payment' && renderPaymentView()}
                    {(step === 'success' || step === 'feedback') && renderSuccessView()} 
                </>
            )}
        </div>

        {/* Footer Navigation */}
        {mode === 'general_chat' ? (
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-start">
                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                    {t.ui.back}
                </button>
            </div>
        ) : (
            step !== 'success' && step !== 'feedback' && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-4">
                    <button
                        onClick={() => {
                            if (mode === 'packet') {
                                if (step === 'destination') onBack();
                                if (step === 'weigh') setStep('destination');
                                if (step === 'address') setStep('weigh');
                                if (step === 'options') setStep('address');
                                if (step === 'payment') setStep('options');
                            } else if (mode === 'letter') {
                                if (step === 'destination') onBack();
                                if (step === 'addressCheck') setStep('destination');
                                if (step === 'address') setStep('addressCheck');
                                if (step === 'format') setStep('addressCheck');
                                if (step === 'options') setStep('format');
                                if (step === 'extras') setStep('options');
                                if (step === 'payment') setStep('extras');
                            } else if (mode === 'payment') {
                                // Payment Back Logic
                                if (step === 'scan') onBack();
                                if (step === 'payDetails') setStep('scan');
                                if (step === 'payReceiver') setStep('payDetails');
                                if (step === 'payConfirm') setStep('payReceiver');
                                if (step === 'paySummary') setStep('payConfirm');
                                if (step === 'payment') setStep('paySummary');
                            }
                        }}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        {t.ui.back}
                    </button>

                    {/* Next Buttons */}
                    {step === 'address' && (
                        <button
                            onClick={() => {
                                if (mode === 'packet') setStep('options');
                                else setStep('format'); 
                            }}
                            disabled={mode === 'packet' && !receiver.name}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {t.ui.next}
                        </button>
                    )}
                    
                    {step === 'options' && (
                        <button
                            onClick={() => {
                                if (mode === 'packet') setStep('payment');
                                else setStep('extras');
                            }}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-all"
                        >
                            {t.ui.next}
                        </button>
                    )}

                    {step === 'extras' && (
                        <button
                            onClick={() => setStep('payment')}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-all"
                        >
                            {t.ui.pay}
                        </button>
                    )}
                    
                    {step === 'payDetails' && (
                        <button
                            onClick={() => setStep('payReceiver')}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-all"
                        >
                            {t.ui.next}
                        </button>
                    )}
                    
                    {step === 'payReceiver' && (
                        <button
                            onClick={() => setStep('payConfirm')}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-all"
                        >
                            {t.ui.next}
                        </button>
                    )}
                    
                    {step === 'paySummary' && (
                        <button
                            onClick={() => setStep('payment')}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-all"
                        >
                            {t.ui.pay}
                        </button>
                    )}

                </div>
            )
        )}
        
        {(step === 'success' || step === 'feedback') && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-center">
                 <button
                    onClick={onBack}
                    className="px-12 py-4 rounded-xl text-base font-bold text-white bg-black hover:bg-gray-900 shadow-lg transition-all"
                >
                    {t.ui.finish}
                </button>
            </div>
        )}

      </div>
    </section>
  );
};
