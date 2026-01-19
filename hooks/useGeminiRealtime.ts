
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
    description: "Navigiert den User zu einem Hauptbereich. Nutze dies SOFORT, wenn der User eine Absicht äußert (z.B. 'Ich will ein Paket verschicken' -> geh zu self_service/packet). Warte nicht auf Bestätigung.",
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
            description: "Nur nötig wenn view='self'. Der spezifische Service."
        }
      },
      required: ["view"]
    }
  },
  {
    name: "control_step",
    description: "Steuert den Schritt innerhalb eines Prozesses. Nutze dies um vorwärts zu gehen, wenn Daten vollständig sind, oder zu einem spezifischen Schritt zu springen.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        step: {
            type: Type.STRING, 
            enum: ['destination', 'weigh', 'packetAddressCheck', 'addressCheck', 'address', 'format', 'options', 'extras', 'payment', 'scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'trackInput', 'trackStatus', 'success'],
            description: "Die ID des Ziel-Schritts."
        }
      },
      required: ["step"]
    }
  }
];

// Localized Prompt Templates
const PROMPT_TEMPLATES: Record<string, { role: string; style: string; strictRule: string; toolRule: string; contextIntro: string; outputRule: string }> = {
    de: {
        role: "DU BIST: Der 'PostAssistant Agent'. Ein intelligenter, handlungsorientierter KI-Mitarbeiter.",
        style: "KOMMUNIKATION: Extrem kurz, präzise und knackig. Kein Smalltalk. Max 1-2 Sätze.",
        strictRule: "FOKUS: Der Prozess steht im Mittelpunkt.",
        toolRule: "HANDLUNG: Nutze Tools (Navigation/Steuerung) PROAKTIV. Frage nicht um Erlaubnis.",
        contextIntro: "WISSENSBASIS & PROZESSE:",
        outputRule: "ANTWORTE: Immer auf DEUTSCH."
    },
    fr: {
        role: "VOUS ÊTES : L'Agent PostAssistant. Un collaborateur IA intelligent et orienté vers l'action.",
        style: "COMMUNICATION : Extrêmement court, précis et percutant. Pas de bavardage. Max 1-2 phrases.",
        strictRule: "FOCUS : Le processus est central.",
        toolRule: "ACTION : Utilisez les outils (Navigation) de manière PROACTIVE.",
        contextIntro: "CONNAISSANCES & PROCESSUS :",
        outputRule: "RÉPONSE : Toujours en FRANÇAIS."
    },
    it: {
        role: "SEI: L'Agente PostAssistant. Un collaboratore IA intelligente e orientato all'azione.",
        style: "COMUNICAZIONE: Estremamente breve, preciso e conciso. Niente chiacchiere. Max 1-2 frasi.",
        strictRule: "FOCUS: Il processo è centrale.",
        toolRule: "AZIONE: Usa gli strumenti (Navigazione) in modo PROATTIVO.",
        contextIntro: "CONOSCENZA & PROCESSI:",
        outputRule: "RISPOSTA: Sempre in ITALIANO."
    },
    en: {
        role: "YOU ARE: The PostAssistant Agent. An intelligent, action-oriented AI worker.",
        style: "COMMUNICATION: Extremely short, crisp, and punchy. No small talk. Max 1-2 sentences.",
        strictRule: "FOCUS: The process is central.",
        toolRule: "ACTION: Use tools (Navigation) PROACTIVELY.",
        contextIntro: "KNOWLEDGE BASE & PROCESSES:",
        outputRule: "ANSWER: Always in ENGLISH."
    },
    es: {
        role: "ERES: El Agente PostAssistant. Inteligente y orientado a la acción.",
        style: "COMUNICACIÓN: Extremadamente corta y concisa.",
        strictRule: "ENFOQUE: El proceso es central.",
        toolRule: "ACCIÓN: Usa herramientas PROACTIVAMENTE.",
        contextIntro: "CONOCIMIENTOS:",
        outputRule: "RESPUESTA: Siempre en ESPAÑOL."
    },
    pt: {
        role: "ÉS: O Agente PostAssistant. Inteligente e orientado para a ação.",
        style: "COMUNICAÇÃO: Extremamente curta e concisa.",
        strictRule: "FOCO: O processo é central.",
        toolRule: "AÇÃO: Usa ferramentas PROATIVAMENTE.",
        contextIntro: "CONHECIMENTOS:",
        outputRule: "RESPOSTA: Sempre em PORTUGUÊS."
    }
};

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings, currentContext }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false); // NEW STATE
    
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
        const procConfigs = settings.processes || {};
        const assistantSettings = settings.assistant;
        const globalDocs = settings.globalDocuments || [];
        
        const tmpl = PROMPT_TEMPLATES[currentLang] || PROMPT_TEMPLATES['de'];

        const formatDocs = (docs: KnowledgeDocument[]) => {
            if (!docs || docs.length === 0) return '---';
            return docs.map(d => `SOURCE "${d.title}": ${d.content}`).join('\n');
        };

        const getLengthInstr = (len: string) => {
            if (len === 'short') return "EXTREMELY BRIEF. Telegraph style. Max 10 words.";
            if (len === 'long') return "Detailed and explanatory. Use bullet points if needed.";
            return "Concise. 1-2 natural sentences."; 
        };

        const getIntensityInstr = (int: string) => {
            if (int === 'passive') return "PASSIVE. Wait for user to ask. Do NOT volunteer next steps.";
            return "PROACTIVE. Lead the conversation. Ask for missing info immediately."; 
        };

        const formatRule = (key: string, name: string) => {
            const conf = procConfigs[key];
            if (!conf || !conf.isEnabled) return '';
            return `=== PROCESS: ${name} (ID: ${key}) ===\nGOAL: ${conf.customPrompt || 'Help the user.'}\nRULES: Length=${getLengthInstr(conf.responseLength)}, Intensity=${getIntensityInstr(conf.supportIntensity)}\nKNOWLEDGE:\n${formatDocs(conf.documents)}\n-------------------------------------`;
        };

        let base = `
${tmpl.role}
${tmpl.style}
${tmpl.strictRule}
${tmpl.toolRule}
GLOBAL SETTINGS: Persona: ${assistantSettings.globalPrompt} | Formality: ${assistantSettings.politeness}

*** CURRENT USER CONTEXT (Where the user is right now): ***
- View: ${currentContext.view}
- Process: ${currentContext.mode}
- Step: ${currentContext.step}

INSTRUCTION: The user has activated you while on this specific screen. 
Immediately offer help relevant to this specific step. 
Example: If step is 'weigh', ask if they need help weighing the package.

${tmpl.contextIntro}
GLOBAL KNOWLEDGE:
${formatDocs(globalDocs)}
AVAILABLE PROCESSES:
${formatRule('packet', 'Paket aufgeben')}
${formatRule('letter', 'Brief versenden')}
${formatRule('payment', 'Einzahlung')}
${formatRule('tracking', 'Sendungsverfolgung')}
${tmpl.outputRule}
        `.trim();

        return base;
    }, [settings, currentLang, currentContext]);

    const connect = async () => {
        if (isConnectedRef.current) return;

        let apiKey = '';
        try { apiKey = process.env.API_KEY || ''; } catch (e) {}

        if (!apiKey) {
            console.error("No API Key found");
            return;
        }

        setIsConnecting(true); // START CONNECTING

        // Initialize Audio Output
        try {
             playerRef.current = new AudioStreamPlayer();
             await playerRef.current.resume();
        } catch (e) {
             console.error("Audio Context initialization failed", e);
             setIsConnecting(false);
             return;
        }

        const genAI = new GoogleGenAI({ apiKey });
        
        try {
            const systemInstruction = buildSystemInstruction();
            console.log("Connecting with Context:", currentContext);

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
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        setIsConnected(true);
                        setIsConnecting(false); // STOP CONNECTING
                        isConnectedRef.current = true;

                        recorderRef.current = new AudioRecorder((pcmBuffer) => {
                            if (!isConnectedRef.current) return;
                            const base64Audio = arrayBufferToBase64(pcmBuffer);
                            sessionPromise.then((session) => {
                                if (isConnectedRef.current) {
                                    try {
                                        session.sendRealtimeInput({
                                            media: { mimeType: 'audio/pcm;rate=16000', data: base64Audio }
                                        });
                                    } catch (err) {}
                                }
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
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result = { success: true };
                                try {
                                    if (fc.name === 'navigate_app') {
                                        const { view, mode } = fc.args as any;
                                        actionsRef.current.onNavigate(view, mode);
                                    } 
                                    else if (fc.name === 'control_step') {
                                        const { step } = fc.args as any;
                                        actionsRef.current.onControlStep(step);
                                    }
                                } catch (err) {
                                    console.error("Tool exec failed", err);
                                    result = { success: false };
                                }
                                sessionPromise.then(session => {
                                    if (isConnectedRef.current) {
                                        session.sendToolResponse({
                                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: result } }]
                                        });
                                    }
                                });
                            }
                        }
                        if (message.serverContent?.interrupted) {
                            playerRef.current?.interrupt();
                            setIsSpeaking(false);
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        setIsConnected(false);
                        setIsConnecting(false);
                        isConnectedRef.current = false;
                    },
                    onerror: (err) => {
                        console.error("Gemini Live Error:", err);
                        setIsConnected(false);
                        setIsConnecting(false);
                        isConnectedRef.current = false;
                        cleanup();
                    }
                }
            });

            const session = await sessionPromise;
            sessionRef.current = session;

        } catch (e) {
            console.error("Connection Failed", e);
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
            console.log("Language changed. Restarting Voice Agent...");
            cleanup();
            setTimeout(() => {
                connect();
            }, 500);
        }
    }, [currentLang, isConnected]);

    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking, isConnecting };
};
