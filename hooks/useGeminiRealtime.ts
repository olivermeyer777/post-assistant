
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings } from './useAppSettings'; 

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
    settings: AppSettings['assistant']; 
}

// NOTE: I am extending the props type locally to include processConfigs which comes from the full settings object
interface ExtendedProps extends UseGeminiRealtimeProps {
    processConfigs?: Record<string, { customPrompt: string }>;
}

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Use a reference to track the session object
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);

    const getFullSettings = () => {
        try {
            const saved = localStorage.getItem('post_app_settings_v2');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
    };

    const buildSystemInstruction = () => {
        const fullSettings = getFullSettings();
        const procConfigs = fullSettings?.processes || {};
        const assistantSettings = fullSettings?.assistant || settings; // Fallback to prop

        let base = `
DU BIST: PostAssistant, der digitale KI-Mitarbeiter der Schweizer Post.

DEINE AUFGABE:
Du hilfst Kunden am Self-Service-Terminal. Du stehst ihnen zur Seite, wenn sie Fragen haben.

GRUNDSÄTZE (STRIKTE EINHALTUNG):
1. REAKTIV SEIN: Sprich nur, wenn du angesprochen wirst oder der Kunde zögert. Quatsche ihn nicht voll.
2. MEHRWERT LIEFERN: Lies NICHT einfach vor, was auf dem Bildschirm steht. Das sieht der Kunde selbst. Erkläre Hintergründe, gib Tipps oder beantworte konkrete Fragen.
3. KURZ FASSEN: Deine Antworten sollen präzise und hilfreich sein. Keine Romane.
4. KNOWLEDGE BASE: Nutze NUR das unten definierte Wissen. Erfinde nichts. Wenn du etwas nicht weisst, sag es höflich.

TONALITÄT:
- Ansprache: ${assistantSettings.politeness === 'formal' ? 'Sie' : 'Du'}.
- Stil: Freundlich, professionell, aber zurückhaltend.

GLOBALE INSTRUKTION:
${assistantSettings.globalPrompt}

PROZESS-SPEZIFISCHE ANWEISUNGEN (Kontextabhängig):
Wenn der Kunde sich in einem dieser Prozesse befindet, beachte folgende Regeln:

- Paket aufgeben (Packet): ${procConfigs['packet']?.customPrompt || ''}
- Brief versenden (Letter): ${procConfigs['letter']?.customPrompt || ''}
- Einzahlung (Payment): ${procConfigs['payment']?.customPrompt || ''}
- Sendungsverfolgung (Tracking): ${procConfigs['tracking']?.customPrompt || ''}

KNOWLEDGE BASE (QUELLE DER WAHRHEIT):
${assistantSettings.knowledgeBase}

ANTWORTE IMMER IN DER SPRACHE: ${currentLang}.
        `.trim();

        return base;
    };

    const connect = async () => {
        if (isConnected) return;

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("No API Key found");
            return;
        }

        playerRef.current = new AudioStreamPlayer();
        await playerRef.current.resume();

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting with System Instruction length:", systemInstruction.length);

            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Puck' } }
                    }
                },
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        setIsConnected(true);

                        recorderRef.current = new AudioRecorder((pcmBuffer) => {
                            const base64Audio = arrayBufferToBase64(pcmBuffer);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64Audio
                                    }
                                });
                            });
                        }, 16000); 
                        recorderRef.current.start();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        setIsConnected(false);
                        cleanup();
                    },
                    onerror: (err) => {
                        console.error("Gemini Live Error:", err);
                        setIsConnected(false);
                        cleanup();
                    }
                }
            });

            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Connection Failed", e);
            cleanup();
        }
    };

    const cleanup = () => {
        recorderRef.current?.stop();
        playerRef.current?.stop();
        setIsSpeaking(false);
    };

    const disconnect = () => {
        cleanup();
        setIsConnected(false);
    };

    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking };
};
