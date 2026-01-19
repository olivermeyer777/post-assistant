
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings } from './useAppSettings'; 

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

// Simplified Tools Definition to prevent Schema Errors (1007)
// Using string literals for Types to avoid runtime enum issues
const toolsDef: FunctionDeclaration[] = [
  {
    name: "navigate_app",
    description: "Navigiert zu einem Bereich.",
    parameters: {
      type: "OBJECT" as Type,
      properties: {
        view: { 
            type: "STRING" as Type, 
            enum: ["home", "self", "oracle"],
            description: "Target View"
        },
        mode: {
            type: "STRING" as Type, 
            enum: ["packet", "letter", "payment", "tracking"],
            description: "Service Mode"
        }
      },
      required: ["view"]
    }
  },
  {
    name: "control_step",
    description: "Steuert den Prozess-Schritt.",
    parameters: {
      type: "OBJECT" as Type,
      properties: {
        step: {
            type: "STRING" as Type, 
            description: "Step ID"
        }
      },
      required: ["step"]
    }
  }
];

const PROMPT_TEMPLATES: Record<string, any> = {
    de: { role: "Du bist der PostAssistant.", lang: "Antworte auf Deutsch." },
    fr: { role: "Tu es le PostAssistant.", lang: "Réponds en français." },
    it: { role: "Sei il PostAssistant.", lang: "Rispondi in italiano." },
    en: { role: "You are the PostAssistant.", lang: "Answer in English." },
    es: { role: "Eres el PostAssistant.", lang: "Responde en español." },
    pt: { role: "És o PostAssistant.", lang: "Responde em português." }
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
        return `${tmpl.role} ${tmpl.lang}
        Keep answers short (max 2 sentences).
        Context: View=${currentContext.view}, Step=${currentContext.step}.
        `.trim();
    }, [currentLang, currentContext]);

    const connect = async () => {
        if (isConnectedRef.current) return;
        setError(null);

        // API Key Validation
        let apiKey = '';
        try { apiKey = process.env.API_KEY || ''; } catch (e) {}
        apiKey = apiKey.replace(/["']/g, "").trim(); // Remove quotes if accidentially added

        if (!apiKey || apiKey.length < 10) {
            console.error("Invalid API Key:", apiKey);
            setError("API Config Error (Key missing).");
            return;
        }

        setIsConnecting(true);

        try {
             // Initialize Audio Context immediately (requires user gesture usually)
             playerRef.current = new AudioStreamPlayer();
             await playerRef.current.resume();
        } catch (e) {
             console.error("Audio Init Failed", e);
             setIsConnecting(false);
             setError("Audio konnte nicht gestartet werden.");
             return;
        }

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting to Gemini Live...", { lang: currentLang });
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
                        console.log("Gemini Live Session Open");
                        setIsConnected(true);
                        setIsConnecting(false);
                        isConnectedRef.current = true;

                        // Start Recording only AFTER connection is established
                        try {
                            recorderRef.current = new AudioRecorder((pcmBuffer) => {
                                if (!isConnectedRef.current) return;
                                
                                // Convert to Base64
                                const base64Audio = arrayBufferToBase64(pcmBuffer);
                                
                                sessionPromise.then((session) => {
                                    if (isConnectedRef.current) {
                                        session.sendRealtimeInput({
                                            media: { mimeType: 'audio/pcm;rate=16000', data: base64Audio }
                                        });
                                    }
                                }).catch(err => console.warn("Session Send Error:", err));
                            }, 16000); // Enforce 16k target
                            
                            await recorderRef.current.start();
                        } catch (recErr) {
                            console.error("Microphone failed", recErr);
                            setError("Mikrofon-Zugriff verweigert.");
                            disconnect();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }

                        // Tool Calls
                        if (message.toolCall) {
                           console.log("Tool Call received:", message.toolCall);
                           for (const fc of message.toolCall.functionCalls) {
                                sessionPromise.then(session => {
                                    const args = fc.args as any;
                                    try {
                                        if(fc.name === 'navigate_app') actionsRef.current.onNavigate(args.view, args.mode);
                                        if(fc.name === 'control_step') actionsRef.current.onControlStep(args.step);
                                    } catch(e) { console.error("Tool exec error", e); }
                                    
                                    // Send result back
                                    session.sendToolResponse({
                                        functionResponses: [{ id: fc.id, name: fc.name, response: { result: { success: true } } }]
                                    });
                                });
                           }
                        }

                        if (message.serverContent?.interrupted) {
                            console.log("Interrupted by user");
                            playerRef.current?.interrupt();
                            setIsSpeaking(false);
                        }
                    },
                    onclose: (e) => {
                        console.log("Gemini Live Closed. Code:", e.code, "Reason:", e.reason);
                        setIsConnected(false);
                        setIsConnecting(false);
                        isConnectedRef.current = false;
                        
                        if (e.code === 1007) {
                            setError("Verbindung abgelehnt (Format-Fehler 1007). Bitte Seite neu laden.");
                        } else if (e.code !== 1000) {
                            setError(`Verbindung getrennt (Code: ${e.code})`);
                        }
                    },
                    onerror: (err) => {
                        console.error("Gemini Live Error:", err);
                        setError("Verbindungsfehler.");
                        cleanup();
                    }
                }
            });

            sessionRef.current = await sessionPromise;

        } catch (e: any) {
            console.error("Connection Init Failed", e);
            setError("Verbindung fehlgeschlagen.");
            setIsConnecting(false);
            cleanup();
        }
    };

    const cleanup = () => {
        isConnectedRef.current = false;
        if (recorderRef.current) recorderRef.current.stop();
        if (playerRef.current) playerRef.current.stop();
        recorderRef.current = null;
        playerRef.current = null;
        setIsSpeaking(false);
        setIsConnected(false);
    };

    const disconnect = () => {
        cleanup();
        sessionRef.current = null;
    };

    // Reconnect on language change (with delay)
    useEffect(() => {
        if (isConnected && currentLang !== activeSessionLangRef.current) {
            cleanup();
            const timer = setTimeout(() => connect(), 800);
            return () => clearTimeout(timer);
        }
    }, [currentLang, isConnected]);

    // Cleanup on unmount
    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking, isConnecting, error };
};
