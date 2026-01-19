
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings } from './useAppSettings'; 
import { buildSystemInstruction } from '../utils/promptUtils';

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    onSubmitFeedback: (score: number) => void;
    onUpdateData: (data: any) => void;
    currentLang: Language;
    settings: AppSettings;
    currentContext: {
        view: string;
        mode: string;
        step: string;
    };
}

const toolsDef = [
  {
    name: "navigate_app",
    description: "Switch view. Params: view (string), mode (string).",
    parameters: {
      type: "OBJECT",
      properties: {
        view: { type: "STRING" },
        mode: { type: "STRING" }
      },
      required: ["view"]
    }
  },
  {
    name: "control_step",
    description: "Go to step. Param: step (string).",
    parameters: {
      type: "OBJECT",
      properties: {
        step: { type: "STRING" }
      },
      required: ["step"]
    }
  },
  {
    name: "update_form_data",
    description: "Fill form. Params: receiverName, receiverCity, weightGrams, trackingCode, etc.",
    parameters: {
      type: "OBJECT",
      properties: {
        receiverName: { type: "STRING" },
        receiverStreet: { type: "STRING" },
        receiverCity: { type: "STRING" },
        receiverZip: { type: "STRING" },
        weightGrams: { type: "NUMBER" },
        trackingCode: { type: "STRING" },
        receiverType: { type: "STRING", enum: ["private", "company"] }
      }
    }
  },
  {
    name: "submit_feedback",
    description: "Submit rating. Param: score (number).",
    parameters: {
      type: "OBJECT",
      properties: {
        score: { type: "NUMBER" }
      },
      required: ["score"]
    }
  }
];

export const useGeminiRealtime = ({ onNavigate, onControlStep, onSubmitFeedback, onUpdateData, currentLang, settings, currentContext }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null); 
    
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);
    const isConnectedRef = useRef(false); 
    
    const activeSessionLangRef = useRef<Language>(currentLang);
    const actionsRef = useRef({ onNavigate, onControlStep, onSubmitFeedback, onUpdateData });
    
    useEffect(() => {
        actionsRef.current = { onNavigate, onControlStep, onSubmitFeedback, onUpdateData };
    }, [onNavigate, onControlStep, onSubmitFeedback, onUpdateData]);

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
            const systemInstruction = buildSystemInstruction(currentLang, settings, currentContext);
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
                                        } catch(sendError) { console.warn("Socket Send Error (ignoring):", sendError); }
                                    }
                                }).catch(err => console.warn("Session Access Error:", err));
                            }, 16000); 
                            
                            await recorderRef.current.start();
                            
                            // *** TRIGGER PROACTIVE GREETING ***
                            // Send a text message to "wake up" the model and make it follow the "SYSTEM_START" instruction
                            sessionPromise.then(session => {
                                setTimeout(() => {
                                    try {
                                        session.sendRealtimeInput({
                                            content: {
                                                parts: [{ text: "SYSTEM_START" }],
                                                role: "user"
                                            }
                                        });
                                    } catch(e) {
                                        console.warn("Could not send initial trigger:", e);
                                    }
                                }, 500);
                            });

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
                                        if(fc.name === 'submit_feedback') actionsRef.current.onSubmitFeedback(args.score);
                                        if(fc.name === 'update_form_data') actionsRef.current.onUpdateData(args);
                                    } catch(e) { console.error("Tool exec error", e); }
                                    
                                    try {
                                        // Send response to confirm tool execution, prompting the model to continue its turn
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
                           if (e.reason && e.reason.includes("API key")) setError("API Key ungültig.");
                           else setError("Verbindung abgelehnt.");
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
