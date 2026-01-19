
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
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

// FIX 1007: Use raw string literals for types instead of SDK Enums to avoid build/runtime mismatches.
// ENHANCED: Added examples and strict allowed values in descriptions to guide the model.
const toolsDef = [
  {
    name: "navigate_app",
    description: "Navigates the app to a specific view. EXAMPLES: 'I want to send a parcel' -> view='self', mode='packet'. 'Track a letter' -> view='self', mode='tracking'. 'Go Home' -> view='home'.",
    parameters: {
      type: "OBJECT",
      properties: {
        view: { 
            type: "STRING", 
            description: "Target view. Allowed: 'home', 'self', 'oracle'."
        },
        mode: {
            type: "STRING", 
            description: "Service mode (required if view='self'). Allowed: 'packet', 'letter', 'payment', 'tracking'."
        }
      },
      required: ["view"]
    }
  },
  {
    name: "control_step",
    description: "Jumps to a specific step in the workflow. Use this to skip ahead or go back.",
    parameters: {
      type: "OBJECT",
      properties: {
        step: {
            type: "STRING", 
            description: "Target step ID. Allowed: 'destination', 'weigh', 'address', 'payment', 'success', 'scan', 'trackInput'."
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
        return `
        ${tmpl.role} ${tmpl.lang}
        
        CRITICAL RULES:
        1. You have FULL CONTROL over the app navigation. 
        2. If the user wants to perform an action (e.g., "Send a package", "Track shipment"), DO NOT explain how to do it.
        3. INSTEAD, IMMEDIATELEY USE the 'navigate_app' tool to take them there.
        4. Be proactive. Act first, talk later.
        5. Keep verbal responses very short (max 1 sentence) when performing actions.
        
        Current State: View=${currentContext.view}, Step=${currentContext.step}.
        `.trim();
    }, [currentLang, currentContext]);

    const connect = async () => {
        if (isConnectedRef.current) return;
        setError(null);

        let apiKey = '';
        try { apiKey = process.env.API_KEY || ''; } catch (e) {}
        apiKey = apiKey.replace(/["']/g, "").trim();

        if (!apiKey || apiKey.length < 10) {
            console.error("Invalid API Key");
            setError("API Key fehlt.");
            return;
        }

        setIsConnecting(true);

        try {
             playerRef.current = new AudioStreamPlayer();
             await playerRef.current.resume();
        } catch (e) {
             console.error("Audio Init Failed", e);
             setIsConnecting(false);
             setError("Audio-Fehler.");
             return;
        }

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting to Gemini Live...");
            activeSessionLangRef.current = currentLang;

            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.assistant.voiceName || 'Puck' } }
                    },
                    tools: [{ functionDeclarations: toolsDef as any }],
                },
                callbacks: {
                    onopen: async () => {
                        console.log("Gemini Live Session Open");
                        setIsConnected(true);
                        setIsConnecting(false);
                        isConnectedRef.current = true;

                        try {
                            recorderRef.current = new AudioRecorder((pcmBuffer) => {
                                if (!isConnectedRef.current) return;
                                if (pcmBuffer.byteLength === 0) return;

                                const base64Audio = arrayBufferToBase64(pcmBuffer);
                                
                                sessionPromise.then((session) => {
                                    if (isConnectedRef.current) {
                                        try {
                                            session.sendRealtimeInput({
                                                media: { mimeType: 'audio/pcm;rate=16000', data: base64Audio }
                                            });
                                        } catch(sendError) {
                                            console.warn("Socket Send Error (ignoring):", sendError);
                                        }
                                    }
                                }).catch(err => console.warn("Session Access Error:", err));
                            }, 16000); 
                            
                            await recorderRef.current.start();
                        } catch (recErr) {
                            console.error("Microphone failed", recErr);
                            setError("Mikrofon blockiert.");
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
                           console.log("Tool Call Received:", message.toolCall);
                           for (const fc of message.toolCall.functionCalls) {
                                sessionPromise.then(session => {
                                    const args = fc.args as any;
                                    try {
                                        console.log(`Executing Tool: ${fc.name}`, args);
                                        if(fc.name === 'navigate_app') actionsRef.current.onNavigate(args.view, args.mode);
                                        if(fc.name === 'control_step') actionsRef.current.onControlStep(args.step);
                                    } catch(e) { console.error("Tool exec error", e); }
                                    
                                    try {
                                        session.sendToolResponse({
                                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: { success: true } } }]
                                        });
                                    } catch(e) { console.warn("Tool Response Error", e); }
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
                        
                        if (e.code === 1007) {
                            if (e.reason && e.reason.includes("API key")) {
                                setError("API Key ungültig oder nicht aktiviert.");
                            } else {
                                setError("Verbindung abgelehnt (Format/Policy).");
                            }
                        } else if (e.code !== 1000) {
                            setError(`Getrennt (Code: ${e.code})`);
                        }
                    },
                    onerror: (err) => {
                        console.error("Gemini Error:", err);
                        setError("Fehler aufgetreten.");
                        cleanup();
                    }
                }
            });

            sessionRef.current = await sessionPromise;

        } catch (e: any) {
            console.error("Connection Failed", e);
            setError("Konnte nicht verbinden.");
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

    useEffect(() => {
        if (isConnected && currentLang !== activeSessionLangRef.current) {
            cleanup();
            const timer = setTimeout(() => connect(), 800);
            return () => clearTimeout(timer);
        }
    }, [currentLang, isConnected]);

    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking, isConnecting, error };
};
