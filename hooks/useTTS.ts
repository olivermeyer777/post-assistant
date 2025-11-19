
import { useState, useCallback, useEffect } from 'react';
import { Language } from '../types';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Map app languages to BCP-47 locale codes for speech synthesis
  const localeMap: Record<Language, string> = {
    de: 'de-DE',
    fr: 'fr-FR',
    it: 'it-IT',
    en: 'en-GB',
    es: 'es-ES',
    pt: 'pt-PT'
  };

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, lang: Language) => {
    if (!window.speechSynthesis) return;

    // Stop any current speech
    cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = localeMap[lang] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, cancel, isSpeaking };
};
