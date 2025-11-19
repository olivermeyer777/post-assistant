
import React, { useState, useEffect } from 'react';
import { TranslationData } from '../types';

interface SelfServiceViewProps {
  t: TranslationData;
  onBack: () => void;
}

type Step = 'destination' | 'weigh' | 'address' | 'options' | 'payment' | 'success' | 'feedback';

interface ReceiverData {
  type: 'private' | 'company';
  name: string;
  street: string;
  zip: string;
  city: string;
}

export const SelfServiceView: React.FC<SelfServiceViewProps> = ({ t, onBack }) => {
  const [step, setStep] = useState<Step>('destination');
  const [isWeighing, setIsWeighing] = useState(false);
  
  // State for "Simulated Data"
  const [receiver, setReceiver] = useState<ReceiverData>({
    type: 'private',
    name: '',
    street: '',
    zip: '',
    city: ''
  });
  const [shippingMethod, setShippingMethod] = useState<'economy' | 'priority'>('economy');
  const [hasSignature, setHasSignature] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);

  // Random Weight State (in grams) - Defaulting to ~7.8kg initially, but will be randomized
  const [weightGrams, setWeightGrams] = useState<number>(7796);

  // Pricing Logic based on Swiss Post (PostPac Economy / Priority)
  // Source: https://www.post.ch/de/pakete-versenden/pakete-schweiz
  const getPrices = (grams: number) => {
    if (grams <= 2000) {
      // Up to 2kg
      return { eco: 7.00, prio: 9.00 };
    } else if (grams <= 10000) {
      // Up to 10kg
      return { eco: 9.70, prio: 10.70 };
    } else {
      // Up to 30kg
      return { eco: 20.50, prio: 23.00 };
    }
  };

  const prices = getPrices(weightGrams);
  const PRICE_SIG = 1.50;

  const totalPrice = (shippingMethod === 'economy' ? prices.eco : prices.prio) + (hasSignature ? PRICE_SIG : 0);

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
      }, 60000); // 60 seconds timeout
    }
    return () => clearTimeout(timer);
  }, [step, onBack]);

  const simulateWeighing = () => {
    setIsWeighing(true);
    // Generate random weight between 500g (0.5kg) and 30000g (30kg)
    const randomWeight = Math.floor(Math.random() * (30000 - 500 + 1)) + 500;
    
    setTimeout(() => {
      setWeightGrams(randomWeight);
      setIsWeighing(false);
      setStep('address');
    }, 2000);
  };

  // Step Flow Logic
  const getProgressPercent = () => {
    switch (step) {
      case 'destination': return 5;
      case 'weigh': return 20;
      case 'address': return 40;
      case 'options': return 60;
      case 'payment': return 80;
      case 'success': return 100;
      case 'feedback': return 100;
      default: return 0;
    }
  };

  const canProceedAddress = () => {
    return receiver.name.trim() !== '' && receiver.zip.trim() !== '' && receiver.city.trim() !== '';
  };

  // --- RENDER FUNCTIONS ---

  const renderProgressBar = () => {
    const stepsList = [
      t.selfService.steps.start,
      t.selfService.steps.weigh,
      t.selfService.steps.address,
      t.selfService.steps.options,
      t.selfService.steps.pay,
      t.selfService.steps.done
    ];

    const currentIdx = ['destination', 'weigh', 'address', 'options', 'payment', 'success', 'feedback'].indexOf(step);
    const visualIdx = step === 'feedback' ? 5 : (currentIdx > 5 ? 5 : currentIdx);

    return (
      <div className="bg-white border-b border-gray-100 pt-6 px-4 md:px-8 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{t.selfService.title}</h1>
        <div className="relative mb-4">
            <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-gray-100">
                <div 
                  style={{ width: `${getProgressPercent()}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FFCC00] transition-all duration-500 ease-in-out"
                ></div>
            </div>
            <div className="hidden md:flex justify-between text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">
               {stepsList.map((label, idx) => (
                 <span key={idx} className={`${idx <= visualIdx ? 'text-gray-900 font-bold' : ''} transition-colors duration-300`}>
                   {label}
                 </span>
               ))}
            </div>
        </div>
      </div>
    );
  };

  const renderDestinationView = () => (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[400px]">
      <div className="text-center max-w-lg mb-4">
         <h3 className="text-xl font-semibold text-gray-800">
           {t.selfService.franking.weighIntro}
         </h3>
      </div>
      
      <button 
        onClick={() => setStep('weigh')}
        className="w-full max-w-lg bg-white border-2 border-[#FFCC00] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-4 group"
      >
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 group-hover:bg-yellow-200 transition-colors">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20 6 9 17l-5-5"/>
           </svg>
        </div>
        <div className="text-left">
           <div className="font-bold text-lg text-gray-900">{t.selfService.franking.destCH}</div>
           <div className="flex gap-2 mt-1 text-xs text-green-600 font-medium">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>{t.selfService.franking.economy}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>{t.selfService.franking.priority}</span>
           </div>
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
               className="group relative w-64 h-64 bg-white rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-300"
            >
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-yellow-600 group-hover:bg-white transition-colors mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                     <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                     <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
               </div>
               <span className="font-semibold text-gray-900">{t.selfService.franking.weighAction}</span>
               <span className="text-xs text-gray-400 mt-1">Click to simulate</span>
            </button>
         </>
       )}
    </div>
  );

  const renderAddressView = () => (
    <div className="flex flex-col gap-6 min-h-[400px]">
       {/* Detected Package Info Banner */}
       <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span className="text-green-800 font-medium text-sm">{t.selfService.franking.detectedLabel}: <span className="font-bold">{formatWeight(weightGrams)}</span></span>
       </div>

       <h2 className="text-xl font-bold text-gray-900">{t.selfService.franking.addressReceiver}</h2>
       
       {/* Type Toggle */}
       <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-md self-center mb-2">
          <button 
            onClick={() => setReceiver({...receiver, type: 'private'})}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${receiver.type === 'private' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.selfService.franking.isPrivate}
          </button>
          <button 
            onClick={() => setReceiver({...receiver, type: 'company'})}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${receiver.type === 'company' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.selfService.franking.isCompany}
          </button>
       </div>

       {/* Form */}
       <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.name}</label>
             <input 
                type="text" 
                value={receiver.name}
                onChange={(e) => setReceiver(prev => ({...prev, name: e.target.value}))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#FFCC00] focus:border-[#FFCC00] outline-none transition-all"
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
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#FFCC00] focus:border-[#FFCC00] outline-none transition-all"
                    placeholder="3000"
                 />
             </div>
             <div className="col-span-2 space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.selfService.franking.fields.city}</label>
                 <input 
                    type="text" 
                    value={receiver.city}
                    onChange={(e) => setReceiver(prev => ({...prev, city: e.target.value}))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#FFCC00] focus:border-[#FFCC00] outline-none transition-all"
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
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#FFCC00] focus:border-[#FFCC00] outline-none transition-all"
                placeholder="Musterstrasse 1"
             />
          </div>
       </div>
    </div>
  );

  const renderOptionsView = () => (
    <div className="flex flex-col gap-8 min-h-[400px]">
       {/* Weight Display (Cool & Centered) */}
       <div className="flex justify-center mb-4 mt-4">
           <div className="bg-white rounded-full w-48 h-48 shadow-xl border-4 border-[#FFCC00] flex flex-col items-center justify-center transform transition-all hover:scale-105 relative">
                <div className="absolute -top-2 w-4 h-8 bg-[#FFCC00] rounded-full opacity-50"></div>
                <span className="text-4xl mb-2">⚖️</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.selfService.franking.weight}</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{formatWeight(weightGrams)}</span>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
             <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">{t.selfService.franking.addressReceiver}</h3>
             <div className="text-gray-600 leading-relaxed">
                {receiver.name || "Muster Hans"}<br/>
                {receiver.street || "Strasse 1"}<br/>
                {receiver.zip} {receiver.city}
             </div>
          </div>

          {/* Right: Selection */}
          <div className="space-y-4">
              <h3 className="font-bold text-gray-900">{t.selfService.franking.shippingMethod}</h3>
              
              {/* Economy */}
              <button 
                onClick={() => setShippingMethod('economy')}
                className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${shippingMethod === 'economy' ? 'border-[#FFCC00] bg-yellow-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                 <div className="text-left">
                    <div className="font-bold text-gray-900">{t.selfService.franking.economy}</div>
                    <div className="text-xs text-gray-500">{t.selfService.franking.duration2days}</div>
                 </div>
                 <div className="font-bold text-lg">CHF {prices.eco.toFixed(2)}</div>
              </button>

              {/* Priority */}
              <button 
                onClick={() => setShippingMethod('priority')}
                className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${shippingMethod === 'priority' ? 'border-[#FFCC00] bg-yellow-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                 <div className="text-left">
                    <div className="font-bold text-gray-900">{t.selfService.franking.priority}</div>
                    <div className="text-xs text-gray-500">{t.selfService.franking.duration1day}</div>
                 </div>
                 <div className="font-bold text-lg">CHF {prices.prio.toFixed(2)}</div>
              </button>

              <div className="pt-4 border-t border-gray-100 mt-4">
                  <h3 className="font-bold text-gray-900 mb-3">{t.selfService.franking.extras}</h3>
                  <button 
                    onClick={() => setHasSignature(!hasSignature)}
                    className="flex items-center justify-between w-full"
                  >
                     <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${hasSignature ? 'bg-black border-black text-white' : 'border-gray-300 bg-white'}`}>
                           {hasSignature && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-gray-700 font-medium">{t.selfService.franking.signature}</span>
                     </div>
                     <span className="font-medium text-gray-900">CHF {PRICE_SIG.toFixed(2)}</span>
                  </button>
              </div>

              <div className="bg-gray-900 text-white p-6 rounded-xl mt-6 flex justify-between items-center">
                 <span className="text-gray-300 font-medium">{t.selfService.franking.total}</span>
                 <span className="text-2xl font-bold">CHF {totalPrice.toFixed(2)}</span>
              </div>
          </div>
       </div>
    </div>
  );

  const renderPaymentView = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.selfService.franking.payTerminal}</h2>
        
        {/* Simulated Terminal Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg my-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500"></div>
            <div className="w-32 h-48 mx-auto bg-gray-800 rounded-xl border-4 border-gray-700 shadow-inner flex flex-col items-center p-4 mb-6">
               <div className="w-full h-20 bg-white/10 rounded mb-4 flex items-center justify-center text-white font-mono text-lg">
                  CHF {totalPrice.toFixed(2)}
               </div>
               <div className="grid grid-cols-3 gap-2 w-full">
                  {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="w-full h-2 bg-gray-600 rounded-sm"></div>)}
               </div>
            </div>
            <div className="flex justify-center gap-4">
               <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">VISA</div>
               <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">MC</div>
               <div className="w-10 h-6 bg-[#FFCC00] rounded border border-yellow-500 flex items-center justify-center text-[8px] font-bold">PF</div>
            </div>
        </div>

        <button
            onClick={() => setStep('success')}
            className="w-full max-w-sm py-4 rounded-2xl font-bold text-gray-900 bg-[#FFCC00] hover:bg-yellow-400 shadow-lg shadow-yellow-400/20 transition-all active:scale-95 text-lg"
        >
           {t.selfService.franking.payButton}
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

        <div className="bg-yellow-50 rounded-3xl p-8 max-w-xl w-full border border-yellow-100">
           <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex-shrink-0 flex items-center justify-center font-bold">1</div>
                 <div className="pt-1 text-gray-800 font-medium">{t.selfService.franking.instruction1}</div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex-shrink-0 flex items-center justify-center font-bold">2</div>
                 <div className="pt-1 text-gray-800 font-medium">{t.selfService.franking.instruction2}</div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex-shrink-0 flex items-center justify-center font-bold">3</div>
                 <div className="pt-1 text-gray-800 font-medium">{t.selfService.franking.instruction3}</div>
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
                     className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 text-xs md:text-sm font-medium hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
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
            {step === 'destination' && renderDestinationView()}
            {step === 'weigh' && renderWeighView()}
            {step === 'address' && renderAddressView()}
            {step === 'options' && renderOptionsView()}
            {step === 'payment' && renderPaymentView()}
            {(step === 'success' || step === 'feedback') && renderSuccessView()} 
        </div>

        {/* Footer Navigation */}
        {step !== 'success' && step !== 'feedback' && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-4">
                {step === 'destination' ? (
                     <button
                        onClick={onBack}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        {t.ui.back}
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            // Custom back logic
                            if (step === 'weigh') setStep('destination');
                            if (step === 'address') setStep('weigh');
                            if (step === 'options') setStep('address');
                            if (step === 'payment') setStep('options');
                        }}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        {t.ui.back}
                    </button>
                )}

                {step === 'address' && (
                    <button
                        onClick={() => setStep('options')}
                        disabled={!canProceedAddress()}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t.ui.next}
                    