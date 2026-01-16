
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings } from './useAppSettings'; // Import settings type

// Tool Definitions
const controlAppFunction: FunctionDeclaration = {
  name: 'control_app',
  parameters: {
    type: Type.OBJECT,
    description: 'Control the application navigation and workflow steps.',
    properties: {
      action: {
          type: Type.STRING,
          enum: ['navigate', 'set_step'],
          description: 'The type of action to perform.'
      },
      target: {
          type: Type.STRING,
          description: 'For navigate: "home", "self_service". For set_step: "destination", "address", "payment", etc.'
      },
      mode: {
          type: Type.STRING,
          enum: ['packet', 'letter', 'payment', 'tracking'],
          description: 'Required if action is navigate and target is self_service.'
      }
    },
    required: ['action', 'target']
  }
};

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
    settings: AppSettings['assistant']; // New prop
}

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Use a reference to track the session object
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);

    // Helper to build dynamic prompt
    const buildSystemInstruction = () => {
        let base = "Du bist der PostAssistant, ein KI-Mitarbeiter der Schweizer Post am Touchscreen.";
        
        // Politeness
        if (settings.politeness === 'formal') {
            base += " Sprich den Kunden immer mit 'Sie' an. Sei höflich und professionell.";
        } else {
            base += " Sprich den Kunden locker mit 'Du' an. Sei kumpelhaft und entspannt.";
        }

        // Length
        if (settings.responseLength === 'short') {
            base += " Fasse dich extrem kurz. Max 1-2 Sätze.";
        } else if (settings.responseLength === 'long') {
            base += " Erkläre Dinge ausführlich und detailreich.";
        }

        // Proactivity
        if (settings.supportStyle === 'reactive') {
            base += " Antworte nur auf direkte Fragen. Mache keine Vorschläge von dir aus.";
        } else if (settings.supportStyle === 'proactive') {
            base += " Sei sehr proaktiv. Schlage dem Kunden von dir aus vor, was er als nächstes tun könnte. Führe ihn aktiv durch den Prozess.";
        }

        // Custom
        if (settings.customPrompt) {
            base += ` ZUSATZ-INSTRUKTION: ${settings.customPrompt}`;
        }
        
        // Lang specific override if needed, but the prompt above sets the tone generally.
        // Adding current language context explicitly:
        base += ` Antworte in der Sprache: ${currentLang}.`;

        return base;
    };

    const connect = async () => {
        if (isConnected) return;

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("No API Key found");
            return;
        }

        // Initialize Audio Player
        playerRef.current = new AudioStreamPlayer();
        await playerRef.current.resume();

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting with System Instruction:", systemInstruction);

            // Initiate the session
            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Puck' } }
                    },
                    tools: [{ functionDeclarations: [controlAppFunction] }],
                },
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        setIsConnected(true);

                        // Start Recording (Input 16kHz)
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
                        }, 16000); // Request 16kHz from browser/recorder
                        recorderRef.current.start();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // 1. Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            // Visual toggle off
                            setTimeout(() => setIsSpeaking(false), 500);
                        }

                        // 2. Handle Tool Calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                console.log("Tool Call:", fc);
                                const args = fc.args as any;
                                let result = { success: true };

                                try {
                                    if (fc.name === 'control_app') {
                                        if (args.action === 'navigate') {
                                            onNavigate(args.target, args.mode);
                                        } else if (args.action === 'set_step') {
                                            onControlStep(args.target);
                                        }
                                    }
                                } catch (e) {
                                    console.error("Tool execution failed", e);
                                    result = { success: false };
                                }

                                // Send Response back
                                sessionPromise.then((session) => {
                                    session.sendToolResponse({
                                        functionResponses: {
                                            id: fc.id,
                                            name: fc.name,
                                            response: result
                                        }
                                    });
                                });
                            }
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
