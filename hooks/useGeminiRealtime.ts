
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';
import { AppSettings, ProcessConfig, KnowledgeDocument } from './useAppSettings'; 

interface UseGeminiRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
    settings: AppSettings;
}

// Localized Prompt Templates
const PROMPT_TEMPLATES: Record<string, { role: string; task: string; strictRule: string; contextIntro: string; globalLabel: string; processLabel: string; outputRule: string }> = {
    de: {
        role: "DU BIST: PostAssistant, der digitale KI-Mitarbeiter der Schweizer Post.",
        task: "DEINE AUFGABE: Du hilfst Kunden am Self-Service-Terminal.",
        strictRule: "STRIKTE REGEL: Antworte NUR basierend auf dem untenstehenden 'GLOBALEN WISSEN' und dem 'PROZESS KONTEXT'. Erfinde keine Fakten.",
        contextIntro: "WISSENSBASIS (Nutze diese Informationen als Faktenquelle):",
        globalLabel: "GLOBALES WISSEN (Gilt IMMER):",
        processLabel: "PROZESS-DEFINITIONEN:",
        outputRule: "WICHTIG: Antworte IMMER auf DEUTSCH."
    },
    fr: {
        role: "VOUS ÊTES : PostAssistant, l'assistant numérique de la Poste Suisse.",
        task: "VOTRE MISSION : Aider les clients au terminal self-service.",
        strictRule: "RÈGLE STRICTE : Répondez UNIQUEMENT sur la base des connaissances fournies ci-dessous. N'inventez rien.",
        contextIntro: "BASE DE CONNAISSANCES (Le contenu ci-dessous peut être en allemand, vous DEVEZ le traduire et l'utiliser comme source) :",
        globalLabel: "CONNAISSANCES GLOBALES (S'appliquent TOUJOURS) :",
        processLabel: "DÉFINITIONS DES PROCESSUS :",
        outputRule: "IMPORTANT : Répondez TOUJOURS en FRANÇAIS."
    },
    it: {
        role: "SEI: PostAssistant, l'assistente digitale della Posta Svizzera.",
        task: "IL TUO COMPITO: Aiutare i clienti al terminale self-service.",
        strictRule: "REGOLA RIGIDA: Rispondi SOLO in base alle conoscenze fornite qui sotto. Non inventare fatti.",
        contextIntro: "BASE DI CONOSCENZA (Il contenuto può essere in tedesco, TRADUCILO e usalo come fonte):",
        globalLabel: "CONOSCENZE GLOBALI (Valgono SEMPRE):",
        processLabel: "DEFINIZIONI DEI PROCESSI:",
        outputRule: "IMPORTANTE: Rispondi SEMPRE in ITALIANO."
    },
    en: {
        role: "YOU ARE: PostAssistant, the digital AI assistant of Swiss Post.",
        task: "YOUR JOB: Help customers at the self-service terminal.",
        strictRule: "STRICT RULE: Answer ONLY based on the KNOWLEDGE provided below. Do not invent facts.",
        contextIntro: "KNOWLEDGE BASE (Content might be in German, you MUST translate and use it as source):",
        globalLabel: "GLOBAL KNOWLEDGE (Always applies):",
        processLabel: "PROCESS DEFINITIONS:",
        outputRule: "IMPORTANT: ALWAYS answer in ENGLISH."
    },
    es: {
        role: "ERES: PostAssistant, el asistente digital de Correos Suiza.",
        task: "TU TAREA: Ayudar a los clientes en la terminal de autoservicio.",
        strictRule: "REGLA ESTRICTA: Responde SOLO basándote en el CONOCIMIENTO proporcionado abajo.",
        contextIntro: "BASE DE CONOCIMIENTOS (El contenido puede estar en alemán, TRADÚCELO y úsalo):",
        globalLabel: "CONOCIMIENTO GLOBAL (Siempre aplica):",
        processLabel: "DEFINICIONES DE PROCESOS:",
        outputRule: "IMPORTANTE: Responde SIEMPRE en ESPAÑOL."
    },
    pt: {
        role: "ÉS: PostAssistant, o assistente digital dos Correios Suíços.",
        task: "A TUA TAREFA: Ajudar os clientes no terminal de self-service.",
        strictRule: "REGRA ESTRITA: Responde APENAS com base no CONHECIMENTO fornecido abaixo.",
        contextIntro: "BASE DE CONHECIMENTO (O conteúdo pode estar em alemão, TRADUZ e usa-o):",
        globalLabel: "CONHECIMENTO GLOBAL (Aplica-se SEMPRE):",
        processLabel: "DEFINIÇÕES DE PROCESSOS:",
        outputRule: "IMPORTANTE: Responde SEMPRE em PORTUGUÊS."
    }
};

export const useGeminiRealtime = ({ onNavigate, onControlStep, currentLang, settings }: UseGeminiRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Use a reference to track the session object
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);

    // Rebuild system instruction dynamically from props (no local storage)
    const buildSystemInstruction = useCallback(() => {
        const procConfigs = settings.processes || {};
        const assistantSettings = settings.assistant;
        const globalDocs = settings.globalDocuments || [];
        
        // Pick the correct language template, fallback to German
        const tmpl = PROMPT_TEMPLATES[currentLang] || PROMPT_TEMPLATES['de'];

        // Helper to format documents
        const formatDocs = (docs: KnowledgeDocument[]) => {
            if (!docs || docs.length === 0) return '---';
            return docs.map(d => `DOC: "${d.title}"\nCONTENT: ${d.content}`).join('\n\n');
        };

        // Helper to format process rules
        const formatRule = (key: string, name: string) => {
            const conf = procConfigs[key];
            if (!conf || !conf.isEnabled) return '';
            
            // Map internal technical values to readable text (can remain English/German mix as model understands it)
            const lengthMap = { short: 'Short (1 sentence)', medium: 'Normal (2-3 sentences)', long: 'Detailed' };
            const intensityMap = { proactive: 'Proactive (Offer help)', passive: 'Passive (Wait for questions)' };

            return `
=== PROCESS: "${name}" (${key}) ===
* Base Instruction: ${conf.customPrompt || '-'}
* Length: ${lengthMap[conf.responseLength] || 'Normal'}
* Style: ${intensityMap[conf.supportIntensity] || 'Proactive'}
* PROCESS SPECIFIC KNOWLEDGE:
${formatDocs(conf.documents)}
===============================================
            `.trim();
        };

        let base = `
${tmpl.role}

${tmpl.task}

${tmpl.strictRule}

${tmpl.contextIntro}

GLOBAL SETTINGS:
1. Formality: ${assistantSettings.politeness === 'formal' ? 'Formal (Sie/Vous/Lei)' : 'Casual (Du/Tu)'}.
2. Character Persona: ${assistantSettings.globalPrompt}

${tmpl.globalLabel}
${formatDocs(globalDocs)}

${tmpl.processLabel}
${formatRule('packet', 'Paket aufgeben')}
${formatRule('letter', 'Brief versenden')}
${formatRule('payment', 'Einzahlung')}
${formatRule('tracking', 'Sendungsverfolgung')}

${tmpl.outputRule}
        `.trim();

        return base;
    }, [settings, currentLang]);

    // Live Update Effect: When settings OR LANGUAGE change, send a "System Update" text to the model
    useEffect(() => {
        if (isConnected && sessionRef.current) {
            console.log(`Context/Language Update (${currentLang}). Sending to Gemini...`);
            const newInstruction = buildSystemInstruction();
            
            // We inject the new instruction as a "User Text Message" that instructs the model to update its context.
            try {
                sessionRef.current.send({
                    parts: [{
                        text: `[SYSTEM_UPDATE_EVENT]
                        CRITICAL: The user has changed the language or settings.
                        FORGET previous system instructions.
                        ADOPT the following NEW System Instruction immediately:
                        
                        ${newInstruction}
                        
                        CONFIRM understanding by waiting for the user's next audio input. DO NOT speak now.`
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
            console.log("Connecting with System Instruction length:", systemInstruction.length);

            const sessionPromise = genAI.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.assistant.voiceName || 'Puck' } }
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
                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const buffer = base64ToArrayBuffer(base64Audio);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            setTimeout(() => setIsSpeaking(false), 500);
                        }

                        // Handle Interruption (Critical for natural feel)
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
