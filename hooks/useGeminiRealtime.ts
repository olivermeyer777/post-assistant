
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
            enum: ['destination', 'weigh', 'addressCheck', 'address', 'format', 'options', 'extras', 'payment', 'scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'trackInput', 'trackStatus', 'success'],
            description: "Die ID des Ziel-Schritts."
        }
      },
      required: ["step"]
    }
  }
];

// Localized Prompt Templates - AGENTIC & CONCISE VERSION
const PROMPT_TEMPLATES: Record<string, { role: string; style: string; strictRule: string; toolRule: string; contextIntro: string; outputRule: string }> = {
    de: {
        role: "DU BIST: Der 'PostAssistant Agent'. Ein intelligenter, handlungsorientierter KI-Mitarbeiter.",
        style: "KOMMUNIKATION: Extrem kurz, präzise und knackig. Kein Smalltalk. Keine Floskeln wie 'Gerne helfe ich Ihnen dabei'. Max 1-2 Sätze.",
        strictRule: "FOKUS: Der Prozess steht im Mittelpunkt. Führe den User effizient zum Ziel. Nutze dein Wissen, um Fragen SOFORT zu klären.",
        toolRule: "HANDLUNG: Nutze Tools (Navigation/Steuerung) PROAKTIV. Frage nicht um Erlaubnis, wenn die Intention klar ist. Tu es einfach.",
        contextIntro: "WISSENSBASIS & PROZESSE:",
        outputRule: "ANTWORTE: Immer auf DEUTSCH."
    },
    fr: {
        role: "VOUS ÊTES : L'Agent PostAssistant. Un collaborateur IA intelligent et orienté vers l'action.",
        style: "COMMUNICATION : Extrêmement court, précis et percutant. Pas de bavardage. Max 1-2 phrases.",
        strictRule: "FOCUS : Le processus est central. Guidez l'utilisateur efficacement. Utilisez vos connaissances pour répondre IMMÉDIATEMENT.",
        toolRule: "ACTION : Utilisez les outils (Navigation) de manière PROACTIVE. Ne demandez pas la permission si l'intention est claire.",
        contextIntro: "CONNAISSANCES & PROCESSUS :",
        outputRule: "RÉPONSE : Toujours en FRANÇAIS."
    },
    it: {
        role: "SEI: L'Agente PostAssistant. Un collaboratore IA intelligente e orientato all'azione.",
        style: "COMUNICAZIONE: Estremamente breve, preciso e conciso. Niente chiacchiere. Max 1-2 frasi.",
        strictRule: "FOCUS: Il processo è centrale. Guida l'utente in modo efficiente. Usa le tue conoscenze per chiarire SUBITO.",
        toolRule: "AZIONE: Usa gli strumenti (Navigazione) in modo PROATTIVO. Non chiedere il permesso se l'intenzione è chiara.",
        contextIntro: "CONOSCENZA & PROCESSI:",
        outputRule: "RISPOSTA: Sempre in ITALIANO."
    },
    en: {
        role: "YOU ARE: The PostAssistant Agent. An intelligent, action-oriented AI worker.",
        style: "COMMUNICATION: Extremely short, crisp, and punchy. No small talk. No fluff. Max 1-2 sentences.",
        strictRule: "FOCUS: The process is central. Guide the user efficiently. Use knowledge to solve issues IMMEDIATELY.",
        toolRule: "ACTION: Use tools (Navigation) PROACTIVELY. Do not ask for permission if intent is clear. Just do it.",
        contextIntro: "KNOWLEDGE BASE & PROCESSES:",
        outputRule: "ANSWER: Always in ENGLISH."
    },
    es: {
        role: "ERES: El Agente PostAssistant. Inteligente y orientado a la acción.",
        style: "COMUNICACIÓN: Extremadamente corta y concisa. Sin charla innecesaria. Máx 1-2 frases.",
        strictRule: "ENFOQUE: El proceso es central. Guía al usuario eficientemente.",
        toolRule: "ACCIÓN: Usa herramientas PROACTIVAMENTE. No pidas permiso si la intención es clara.",
        contextIntro: "CONOCIMIENTOS:",
        outputRule: "RESPUESTA: Siempre en ESPAÑOL."
    },
    pt: {
        role: "ÉS: O Agente PostAssistant. Inteligente e orientado para a ação.",
        style: "COMUNICAÇÃO: Extremamente curta e concisa. Sem conversa fiada. Máx 1-2 frases.",
        strictRule: "FOCO: O processo é central. Guia o utilizador eficientemente.",
        toolRule: "AÇÃO: Usa ferramentas PROATIVAMENTE. Não peças permissão se a intenção for clara.",
        contextIntro: "CONHECIMENTOS:",
        outputRule: "RESPOSTA: Sempre em PORTUGUÊS."
    }
};

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Use a reference to track the session object
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);
    
    // Refs for callbacks to avoid closure staleness
    const actionsRef = useRef({ onNavigate, onControlStep });
    useEffect(() => {
        actionsRef.current = { onNavigate, onControlStep };
    }, [onNavigate, onControlStep]);

    // Rebuild system instruction dynamically from props
    const buildSystemInstruction = useCallback(() => {
        const procConfigs = settings.processes || {};
        const assistantSettings = settings.assistant;
        const globalDocs = settings.globalDocuments || [];
        
        // Pick the correct language template, fallback to German
        const tmpl = PROMPT_TEMPLATES[currentLang] || PROMPT_TEMPLATES['de'];

        // Helper to format documents
        const formatDocs = (docs: KnowledgeDocument[]) => {
            if (!docs || docs.length === 0) return '---';
            return docs.map(d => `SOURCE "${d.title}": ${d.content}`).join('\n');
        };

        // Helper to format process rules
        const formatRule = (key: string, name: string) => {
            const conf = procConfigs[key];
            if (!conf || !conf.isEnabled) return '';
            
            return `
PROCESS "${name}" (ID: ${key}):
- Instruction: ${conf.customPrompt || 'Standard process'}
- Specific Knowledge:
${formatDocs(conf.documents)}
            `.trim();
        };

        let base = `
${tmpl.role}
${tmpl.style}
${tmpl.strictRule}
${tmpl.toolRule}

${tmpl.contextIntro}

GLOBAL SETTINGS:
- Persona: ${assistantSettings.globalPrompt}
- Formality: ${assistantSettings.politeness}

GLOBAL KNOWLEDGE (Apply to all queries):
${formatDocs(globalDocs)}

AVAILABLE PROCESSES (Use navigate_app tool to start these):
${formatRule('packet', 'Paket aufgeben')}
${formatRule('letter', 'Brief versenden')}
${formatRule('payment', 'Einzahlung')}
${formatRule('tracking', 'Sendungsverfolgung')}

${tmpl.outputRule}
        `.trim();

        return base;
    }, [settings, currentLang]);

    // Live Update Effect
    useEffect(() => {
        if (isConnected && sessionRef.current) {
            console.log(`Context/Language Update (${currentLang}). Sending to Gemini...`);
            const newInstruction = buildSystemInstruction();
            
            try {
                sessionRef.current.send({
                    parts: [{
                        text: `[SYSTEM_UPDATE]
                        Language/Context changed. 
                        NEW INSTRUCTION: ${newInstruction}
                        
                        REMEMBER: Be an agent. Use tools proactively. Keep it short.`
                    }]
                });
            } catch (e) {
                console.warn("Failed to send live update to Gemini:", e);
            }
        }
    }, [settings, currentLang, isConnected, buildSystemInstruction]);

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
            console.log("Connecting with Agent Persona...");

            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.assistant.voiceName || 'Puck' } }
                    },
                    tools: [{ functionDeclarations: toolsDef }] // Inject Tools
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
                        // 1. Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }

                        // 2. Handle Tool Calls (Agentic Behavior)
                        if (message.toolCall) {
                            console.log("Agent Tool Call Received:", message.toolCall);
                            
                            // We might have multiple calls in one turn
                            for (const fc of message.toolCall.functionCalls) {
                                // Fix: Explicit type for result to include optional error field
                                let result: { success: boolean; error?: string } = { success: true };
                                
                                try {
                                    if (fc.name === 'navigate_app') {
                                        const { view, mode } = fc.args as any;
                                        console.log(`Agent navigating to: ${view}/${mode}`);
                                        actionsRef.current.onNavigate(view, mode);
                                    } 
                                    else if (fc.name === 'control_step') {
                                        const { step } = fc.args as any;
                                        console.log(`Agent setting step to: ${step}`);
                                        actionsRef.current.onControlStep(step);
                                    }
                                } catch (err) {
                                    console.error("Tool execution failed", err);
                                    result = { success: false, error: String(err) };
                                }

                                // Send Response back to Model (Required)
                                sessionPromise.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: result }
                                        }]
                                    });
                                });
                            }
                        }

                        // 3. Handle Interruption
                        if (message.serverContent?.interrupted) {
                            console.log("Model interrupted by user");
                            playerRef.current?.interrupt();
                            setIsSpeaking(false);
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
