
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';

const getSystemInstruction = (lang: Language) => {
  const instructions: Record<Language, string> = {
    de: 'Du bist der Sprachassistent der Schweizer Post. Begrüsse den Nutzer kurz auf Deutsch: "Grüezi! Wie kann ich helfen?" Halte Antworten kurz (max 2 Sätze).',
    fr: 'Vous êtes l\'assistant vocal de la Poste Suisse. Saluez brièvement l\'utilisateur en français : "Bonjour ! Comment puis-je vous aider ?" Gardez les réponses courtes.',
    it: 'Sei l\'assistente vocale della Posta Svizzera. Saluta brevemente l\'utente in italiano: "Buongiorno! Come posso aiutare?" Mantieni le risposte brevi.',
    en: 'You are the voice assistant for Swiss Post. Greet the user briefly: "Hello! How can I assist you?" Keep answers short (max 2 sentences).',
    es: 'Eres el asistente de voz de Correos Suiza. Saluda brevemente al usuario en español: "¡Hola! ¿Cómo puedo ayudarle?" Mantén las respuestas cortas.',
    pt: 'É o assistente de voz dos Correios Suíços. Cumprimente brevemente o utilizador em português: "Olá! Como posso ajudar?" Mantenha as respostas curtas.'
  };
  return instructions[lang] || instructions['de'];
};

interface UseLiveGeminiProps {
  onNavigateOracle: () => void;
  onNavigateHome: () => void;
  onChangeLanguage: (lang: Language) => void;
  onMessageUpdate: (text: string, sender: 'user' | 'assistant') => void;
  onConnect: () => void;
}

export const useLiveGemini = ({ 
  onNavigateOracle, 
  onNavigateHome, 
  onChangeLanguage,
  onMessageUpdate,
  onConnect
}: UseLiveGeminiProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);

  const handlersRef = useRef({ onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect });
  useEffect(() => {
    handlersRef.current = { onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect };
  }, [onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect]);

  const connect = async (language: Language) => {
    if (isConnected) return;
    setError(null);
    
    const apiKey = process.env.API_KEY;
    const genAI = new GoogleGenAI({ apiKey });
    
    // Initialize Player immediately to capture user gesture for Autoplay policy
    playerRef.current = new AudioStreamPlayer();
    // Explicitly resume audio context on user click to prevent "silent" playback
    await playerRef.current.resume();

    try {
      const sessionPromise = genAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: getSystemInstruction(language),
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
          }
        },
        callbacks: {
            onopen: async () => {
                console.log("Live Session Connected");
                setIsConnected(true);
                handlersRef.current.onConnect();
                
                // Session is established. 
                // We removed the session.send() call as it caused runtime errors in this SDK version.
                // The bot is now ready to receive audio.
                
                // Start Microphone
                try {
                  recorderRef.current = new AudioRecorder((pcmData) => {
                      const base64 = arrayBufferToBase64(pcmData);
                      sessionPromise.then(sess => {
                          sess.sendRealtimeInput({
                              media: {
                                mimeType: "audio/pcm;rate=16000",
                                data: base64
                              }
                          });
                      });
                  });
                  await recorderRef.current.start();
                } catch (micError) {
                  console.error("Microphone access failed", micError);
                  setError("microphone");
                  disconnect();
                }
            },
            onmessage: async (msg) => {
                if (msg.serverContent?.modelTurn?.parts) {
                    for (const part of msg.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
                            playerRef.current?.addChunk(audioBuffer);
                            
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }
                    }
                }
            },
            onclose: () => {
                console.log("Live Session Closed");
                disconnect();
            },
            onerror: (err) => {
                console.error("Live Session Error", err);
                setError("generic");
                disconnect();
            }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Connection Failed", e);
      setError("generic");
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (recorderRef.current) {
        recorderRef.current.stop();
    }
    if (playerRef.current) {
        playerRef.current.stop();
    }
    
    // Attempt to close properly
    try {
       // sessionRef.current?.close(); 
    } catch(e) { console.warn("Session close error", e); }

    setIsConnected(false);
    setIsSpeaking(false);
    sessionRef.current = null;
  };

  return {
    isConnected,
    isSpeaking,
    error,
    connect,
    disconnect
  };
};
