

import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings, ProcessConfig, KnowledgeDocument } from './useAppSettings'; 

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
    settings: AppSettings;
    currentContext: {
        view: string;
        mode: string;
        step: string;
    };
}

// --- TOOLS DEFINITION ---
const toolsDef: FunctionDeclaration[] = [
  {
    name: "navigate_app",
    description: "Navigiert den User zu einem Hauptbereich.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: { 
            type: Type.STRING, 
            enum: ["home", "self", "oracle"],
            description: "Der Ziel-View."
        },
        mode: {
            type: Type.STRING, 
            enum: ["packet", "letter", "payment", "tracking"],
            description: "Service Modus."
        }
      },
      required: ["view"]
    }
  },
  {
    name: "control_step",
    description: "Steuert den Schritt innerhalb eines Prozesses.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        step: {
            type: Type.STRING, 
            enum: ['destination', 'weigh', 'packetAddressCheck', 'addressCheck', 'address', 'format', 'options', 'extras', 'payment', 'scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'trackInput', 'trackStatus', 'success'],
            description: "Step ID."
        }
      },
      required: ["step"]
    }
  }
];

const PROMPT_TEMPLATES: Record<string, any> = {
    de: { role: "DU BIST: Der 'PostAssistant'.", outputRule: "ANTWORTE: DEUTSCH." },
    fr: { role: "VOUS ÊTES : 'PostAssistant'.", outputRule: "RÉPONSE : FRANÇAIS." },
    it: { role: "SEI: 'PostAssistant'.", outputRule: "RISPOSTA: ITALIANO." },
    en: { role: "YOU ARE: 'PostAssistant'.", outputRule: "ANSWER: ENGLISH." },
    es: { role: "ERES: 'PostAssistant'.", outputRule: "RESPUESTA: ESPAÑOL." },
    pt: { role: "ÉS: 'PostAssistant'.", outputRule: "RESPOSTA: PORTUGUÊS." }
};

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings, currentContext }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null); 
    
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);
    const isConnectedRef = useRef(false); 
    
    const activeSessionLangRef = useRef<Language>(currentLang);
    const actionsRef = useRef({ onNavigate, onControlStep });

    useEffect(() => {
        actionsRef.current = { onNavigate, onControlStep };
    }, [onNavigate, onControlStep]);

    const buildSystemInstruction = useCallback(() => {
        const tmpl = PROMPT_TEMPLATES[currentLang] || PROMPT_TEMPLATES['de'];
        // Simplified Prompt to reduce connection payload size risk
        return `
${tmpl.role}
CONTEXT: View=${currentContext.view}, Step=${currentContext.step}.
Keep answers SHORT (max 2 sentences).
Use Tools for navigation.
${tmpl.outputRule}
        `.trim();
    }, [settings, currentLang, currentContext]);

    const connect = async () => {
        if (isConnectedRef.current) return;
        setError(null);

        let apiKey = '';
        try { apiKey = process.env.API_KEY || ''; } catch (e) {}

        if (apiKey) {
            apiKey = apiKey.trim().split(" ")[0]; // Sanitize
        }

        if (!apiKey) {
            setError("Fehler: API Key fehlt.");
            return;
        }

        setIsConnecting(true);

        try {
             playerRef.current = new AudioStreamPlayer();
             await playerRef.current.resume();
        } catch (e) {
             console.error("Audio Context Init Failed", e);
             setIsConnecting(false);
             setError("Audio-Fehler (Browser blockiert?).");
             return;
        }

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting...");
            activeSessionLangRef.current = currentLang;

            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.assistant.voiceName || 'Puck' } }
                    },
                    tools: [{ functionDeclarations: toolsDef }]
                },
                callbacks: {
                    onopen: async () => {
                        console.log("Gemini Live Connected");
                        setIsConnected(true);
                        setIsConnecting(false);
                        isConnectedRef.current = true;

                        try {
                            recorderRef.current = new AudioRecorder((pcmBuffer) => {
                                if (!isConnectedRef.current) return;
                                const base64Audio = arrayBufferToBase64(pcmBuffer);
                                sessionPromise.then((session) => {
                                    if (isConnectedRef.current) {
                                        try {
                                            session.sendRealtimeInput({
                                                media: { mimeType: 'audio/pcm;rate=16000', data: base64Audio }
                                            });
                                        } catch (err) {
                                            console.warn("Send failed", err);
                                        }
                                    }
                                });
                            }, 16000); 
                            await recorderRef.current.start();
                        } catch (recErr) {
                            console.error("Mic start failed", recErr);
                            setError("Mikrofon-Zugriff verweigert.");
                            disconnect();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }
                        if (message.toolCall) {
                           // Tool execution logic...
                           for (const fc of message.toolCall.functionCalls) {
                                sessionPromise.then(session => {
                                    const args = fc.args as any;
                                    if(fc.name === 'navigate_app') actionsRef.current.onNavigate(args.view, args.mode);
                                    if(fc.name === 'control_step') actionsRef.current.onControlStep(args.step);
                                    session.sendToolResponse({
                                        functionResponses: [{ id: fc.id, name: fc.name, response: { result: {success:true} } }]
                                    });
                                });
                           }
                        }
                        if (message.serverContent?.interrupted) {
                            playerRef.current?.interrupt();
                            setIsSpeaking(false);
                        }
                    },
                    onclose: (e) => {
                        console.log("Gemini Live Closed", e);
                        setIsConnected(false);
                        setIsConnecting(false);
                        isConnectedRef.current = false;
                        
                        // Detailed Error Reporting
                        if (e.code === 1000) {
                            // Normal closure
                        } else if (e.code === 4003) {
                             setError("API Quota exceeded or API not enabled.");
                        } else if (e.code === 1006) {
                             setError("Verbindung unerwartet getrennt (Netzwerk/Server).");
                        } else {
                             setError(`Verbindung getrennt (Code: ${e.code}).`);
                        }
                    },
                    onerror: (err) => {
                        console.error("Gemini Live Error:", err);
                        setIsConnected(false);
                        setIsConnecting(false);
                        isConnectedRef.current = false;
                        setError("Verbindungsfehler.");
                        cleanup();
                    }
                }
            });

            sessionRef.current = await sessionPromise;

        } catch (e: any) {
            console.error("Connection Failed", e);
            let msg = "Verbindung fehlgeschlagen.";
            if (e.message && e.message.includes("403")) msg = "API Key ungültig (403).";
            setError(msg);
            cleanup();
            setIsConnecting(false);
        }
    };

    const cleanup = () => {
        isConnectedRef.current = false;
        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current = null;
        }
        setIsSpeaking(false);
        setIsConnecting(false);
        sessionRef.current = null;
        setIsConnected(false);
    };

    const disconnect = () => {
        cleanup();
    };

    useEffect(() => {
        if (isConnected && currentLang !== activeSessionLangRef.current) {
            cleanup();
            setTimeout(() => connect(), 500);
        }
    }, [currentLang, isConnected]);

    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking, isConnecting, error };
};
