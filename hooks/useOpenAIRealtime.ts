
import { useState, useRef, useEffect } from 'react';
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';

const TOOLS = [
  {
    type: "function",
    name: "navigate_app",
    description: "Navigates the user to a different main section of the application. Use this when the user wants to start a specific task like sending a packet.",
    parameters: {
      type: "object",
      properties: {
        view: { 
            type: "string", 
            enum: ["home", "self_service", "video_consultation"],
            description: "The main view to navigate to."
        },
        mode: {
            type: "string",
            enum: ["packet", "letter", "payment", "tracking"],
            description: "If view is self_service, this specifies which sub-service to open."
        }
      },
      required: ["view"]
    }
  },
  {
    type: "function",
    name: "control_self_service_step",
    description: "Controls the specific step within the self-service workflow. Use this to move forward, backward, or jump to a step.",
    parameters: {
      type: "object",
      properties: {
        step: {
            type: "string",
            enum: ['destination', 'weigh', 'address', 'options', 'payment', 'success', 'scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'trackInput'],
            description: "The target step ID to jump to."
        }
      },
      required: ["step"]
    }
  }
];

const SYSTEM_PROMPTS: Record<Language, string> = {
    de: "Du bist der Sprachassistent der Schweizer Post. Du kannst die App steuern. Wenn der Nutzer sagt 'Paket versenden', navigiere zur Paket-Ansicht. Sei hilfreich, kurz und freundlich.",
    fr: "Vous êtes l'assistant vocal de la Poste Suisse. Vous pouvez contrôler l'application. Soyez utile, bref et amical.",
    it: "Sei l'assistente vocale della Posta Svizzera. Puoi controllare l'applicazione. Sii utile, breve e amichevole.",
    en: "You are the voice assistant for Swiss Post. You can control the application screen. If the user says 'Send a parcel', navigate to the packet view. Be helpful, short, and friendly.",
    es: "Eres el asistente de voz de Correos Suiza. Puedes controlar la aplicación. Sé útil, breve y amable.",
    pt: "É o assistente de voz dos Correios Suíços. Pode controlar a aplicação. Seja útil, breve e amigável."
};

interface UseOpenAIRealtimeProps {
    onNavigate: (view: string, mode?: string) => void;
    onControlStep: (step: string) => void;
    currentLang: Language;
}

export const useOpenAIRealtime = ({ onNavigate, onControlStep, currentLang }: UseOpenAIRealtimeProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // AI speaking
    
    const socketRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioStreamPlayer | null>(null);

    const connect = async () => {
        if (isConnected) return;

        const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY; // Fallback
        if (!apiKey) {
            console.error("No API Key found for OpenAI Realtime");
            return;
        }

        // Initialize Audio
        playerRef.current = new AudioStreamPlayer();
        await playerRef.current.resume();

        // Connect WebSocket
        const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        const ws = new WebSocket(url, [
            "realtime",
            "openai-insecure-api-key." + apiKey,
            "openai-beta.realtime-v1"
        ]);

        ws.onopen = () => {
            console.log("OpenAI Realtime Connected");
            setIsConnected(true);
            
            // 1. Send Session Update (Config)
            const sessionUpdate = {
                type: "session.update",
                session: {
                    modalities: ["text", "audio"],
                    instructions: SYSTEM_PROMPTS[currentLang] || SYSTEM_PROMPTS['de'],
                    voice: "alloy",
                    input_audio_format: "pcm16",
                    output_audio_format: "pcm16",
                    input_audio_transcription: {
                        model: "whisper-1"
                    },
                    turn_detection: {
                        type: "server_vad",
                        threshold: 0.5,
                        prefix_padding_ms: 300,
                        silence_duration_ms: 500
                    },
                    tools: TOOLS,
                    tool_choice: "auto",
                }
            };
            ws.send(JSON.stringify(sessionUpdate));

            // 2. Start Recording
            recorderRef.current = new AudioRecorder((pcmBuffer) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const base64Audio = arrayBufferToBase64(pcmBuffer);
                    ws.send(JSON.stringify({
                        type: "input_audio_buffer.append",
                        audio: base64Audio
                    }));
                }
            });
            recorderRef.current.start();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case "response.audio.delta":
                        if (data.delta) {
                            const buffer = base64ToArrayBuffer(data.delta);
                            playerRef.current?.addChunk(buffer);
                            setIsSpeaking(true);
                            // Simple timeout to toggle speaking state off visually
                            setTimeout(() => setIsSpeaking(false), 600); 
                        }
                        break;

                    case "response.function_call_arguments.done":
                        // Execute the tool
                        // Capture call_id which is required for the response
                        if (data.arguments) {
                            handleToolCall(data.name, JSON.parse(data.arguments), data.call_id);
                        }
                        break;
                    
                    case "response.done":
                        // Logic to confirm response finished
                        break;
                    
                    case "error":
                        // Log the full data object so we can see the error structure in console
                        console.error("OpenAI Realtime Error:", data); 
                        break;
                }
            } catch (err) {
                console.error("Error parsing WebSocket message", err);
            }
        };

        ws.onclose = () => {
            console.log("OpenAI Socket Closed");
            setIsConnected(false);
            cleanup();
        };

        ws.onerror = (err) => {
            console.error("OpenAI Socket Error");
            cleanup();
        };

        socketRef.current = ws;
    };

    const handleToolCall = (name: string, args: any, callId: string) => {
        console.log("Tool Call:", name, args);
        if (name === "navigate_app") {
            onNavigate(args.view, args.mode);
        } else if (name === "control_self_service_step") {
            onControlStep(args.step);
        }

        // Send output back to model (Required to complete the turn)
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: callId, // Required: The ID from the arguments.done event
                    output: JSON.stringify({ success: true }) // Output must be a string
                }
            }));
            
            // Trigger the model to respond to the tool output
            socketRef.current.send(JSON.stringify({ type: "response.create" }));
        }
    };

    const cleanup = () => {
        recorderRef.current?.stop();
        playerRef.current?.stop();
        setIsSpeaking(false);
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        cleanup();
        setIsConnected(false);
    };

    useEffect(() => {
        return () => disconnect();
    }, []);

    return { connect, disconnect, isConnected, isSpeaking };
};
