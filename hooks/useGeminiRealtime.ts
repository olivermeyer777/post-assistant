
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings, ProcessConfig } from './useAppSettings'; 

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
    settings: AppSettings['assistant']; 
}

// NOTE: I am extending the props type locally to include processConfigs which comes from the full settings object
interface ExtendedProps extends UseGeminiRealtimeProps {
    processConfigs?: Record<string, ProcessConfig>;
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
            const saved = localStorage.getItem('post_app_settings_v3');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
    };

    const buildSystemInstruction = () => {
        const fullSettings = getFullSettings();
        const procConfigs = fullSettings?.processes || {};
        const assistantSettings = fullSettings?.assistant || settings; // Fallback to prop

        // Helper to format process rules
        const formatRule = (key: string, name: string) => {
            const conf = procConfigs[key];
            if (!conf || !conf.isEnabled) return '';
            
            return `
- PROZESS "${name}" (${key}):
  * Instruktion: ${conf.customPrompt || 'Keine spezifische Instruktion.'}
  * Antwortlänge: ${conf.responseLength === 'short' ? 'Sehr kurz (1 Satz)' : conf.responseLength === 'medium' ? 'Normal (2-3 Sätze)' : 'Ausführlich'}
  * Intensität: ${conf.supportIntensity === 'proactive' ? 'Proaktiv (Biete Hilfe aktiv an, führe den User)' : 'Passiv (Antworte nur auf konkrete Fragen)'}
            `.trim();
        };

        let base = `
DU BIST: PostAssistant, der digitale KI-Mitarbeiter der Schweizer Post.

DEINE AUFGABE:
Du hilfst Kunden am Self-Service-Terminal.

GLOBALE EINSTELLUNGEN (Immer gültig):
1. Ansprache: ${assistantSettings.politeness === 'formal' ? 'Sie' : 'Du'}.
2. Globaler Charakter: ${assistantSettings.globalPrompt}
3. KNOWLEDGE BASE (Wissen): Nutze NUR das unten definierte Wissen.

PROZESS-SPEZIFISCHE REGELN (Kontextabhängig):
Wenn der Kunde sich in einem dieser Prozesse befindet, beachte zwingend diese Abweichungen:

${formatRule('packet', 'Paket aufgeben')}
${formatRule('letter', 'Brief versenden')}
${formatRule('payment', 'Einzahlung')}
${formatRule('tracking', 'Sendungsverfolgung')}

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
