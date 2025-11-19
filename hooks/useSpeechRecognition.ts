
import { useState, useCallback, useRef, useEffect } from 'react';
import { Language } from '../types';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  
  // Map app languages to BCP-47
  const localeMap: Record<Language, string> = {
    de: 'de-DE',
    fr: 'fr-FR',
    it: 'it-IT',
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-PT'
  };

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback((
    lang: Language, 
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      if (onError) onError("Browser not supported");
      return;
    }

    // Stop previous instance if exists
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = localeMap[lang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (onError) onError(event.error);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = final || interim;
      if (currentText) {
        onResult(currentText, !!final);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isListening, startListening, stopListening };
};
