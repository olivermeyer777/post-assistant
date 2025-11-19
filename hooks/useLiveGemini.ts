
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';

const SYSTEM_INSTRUCTION = `
You are the specific voice assistant for Swiss Post.
Your interaction MUST start with a specific greeting.

RULES:
1. When the session starts or you hear the first sound, you MUST say exactly: "How can I assist you?"
2. Wait for the user to respond.
3. Keep answers concise (max 2 sentences) and helpful.
4. Speak in English.
`;

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

    try {
      const sessionPromise = genAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
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
                
                // Start Microphone
                try {
                  recorderRef.current = new AudioRecorder((pcmData) => {
                      const base64 = arrayBufferToBase64(pcmData);
                      sessionPromise.then(session => {
                          session.sendRealtimeInput({
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
