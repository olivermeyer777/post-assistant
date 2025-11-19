
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Tool, Type, Modality } from "@google/genai";
import { AudioRecorder, AudioStreamPlayer, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioStreamer';
import { Language } from '../types';

const API_KEY = process.env.API_KEY || "";

// Define Tools
const navigationTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "navigateToOracle",
        description: "Navigate to the Oracle/Assistant chat view. Use this when the user wants to chat, ask a question, or needs help.",
      },
      {
        name: "navigateToHome",
        description: "Navigate to the Home screen. Use this when the user wants to go back or see the main menu.",
      },
      {
        name: "changeLanguage",
        description: "Change the application language.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description: "The language code to switch to (de, fr, it, en, es, pt).",
              enum: ["de", "fr", "it", "en", "es", "pt"]
            }
          },
          required: ["language"]
        }
      }
    ]
  }
];

interface UseLiveGeminiProps {
  onNavigateOracle: () => void;
  onNavigateHome: () => void;
  onChangeLanguage: (lang: Language) => void;
  onMessageUpdate: (text: string, sender: 'user' | 'assistant') => void;
  onConnect: () => void;
}

export const useLiveGemini = ({ 
  onNavigateOracle, 
  onNavigateHome, 
  onChangeLanguage,
  onMessageUpdate,
  onConnect
}: UseLiveGeminiProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Bot is speaking
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);

  // Transcription Buffers
  const inputBuffer = useRef("");
  const outputBuffer = useRef("");

  // Need refs for callbacks to access latest props
  const handlersRef = useRef({ onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect });
  useEffect(() => {
    handlersRef.current = { onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect };
  }, [onNavigateOracle, onNavigateHome, onChangeLanguage, onMessageUpdate, onConnect]);

  const connect = async (language: Language) => {
    if (isConnected) return;
    setError(null);
    if (!API_KEY) {
        console.error("No API Key found");
        setError("No API Key configured");
        return;
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    playerRef.current = new AudioStreamPlayer();

    try {
      const sessionPromise = genAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: navigationTools,
          systemInstruction: `You are the voice interface for the "Swiss Post Assistant". 
          Current Language Context: ${language}.
          ALWAYS speak and respond in the language: ${language}.
          
          You can navigate the app for the user. 
          If the user says "Go to assistant" or "I have a question", use the navigateToOracle tool.
          If the user says "Go home", use the navigateToHome tool.
          If the user wants to speak another language, use the changeLanguage tool.
          Be brief, helpful, and polite.`,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
          },
          // Enable transcription with empty objects (default model)
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
            onopen: async () => {
                console.log("Live Session Connected");
                setIsConnected(true);
                handlersRef.current.onConnect();
                
                // Reset buffers
                inputBuffer.current = "";
                outputBuffer.current = "";

                try {
                  // Start Recording
                  recorderRef.current = new AudioRecorder((pcmData) => {
                      const base64 = arrayBufferToBase64(pcmData);
                      sessionPromise.then(session => {
                          session.sendRealtimeInput({
                              media: {
                                mimeType: "audio/pcm;rate=16000",
                                data: base64
                              }
                          });
                      });
                  });
                  await recorderRef.current.start();
                } catch (micError) {
                  console.error("Microphone access failed", micError);
                  setError("microphone"); // Set specific code for mic
                  disconnect();
                }
            },
            onmessage: async (msg) => {
                // Handle Audio Output
                if (msg.serverContent?.modelTurn?.parts) {
                    for (const part of msg.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
                            playerRef.current?.addChunk(audioBuffer);
                            setIsSpeaking(true);
                            // Simple debounce for visualizer
                            setTimeout(() => setIsSpeaking(false), 2000);
                        }
                    }
                }

                // Handle Transcription
                if (msg.serverContent?.inputTranscription?.text) {
                    inputBuffer.current += msg.serverContent.inputTranscription.text;
                }
                if (msg.serverContent?.outputTranscription?.text) {
                    outputBuffer.current += msg.serverContent.outputTranscription.text;
                }

                // Turn Complete - Flush Transcripts
                if (msg.serverContent?.turnComplete) {
                    if (inputBuffer.current.trim()) {
                        handlersRef.current.onMessageUpdate(inputBuffer.current, 'user');
                        inputBuffer.current = "";
                    }
                    if (outputBuffer.current.trim()) {
                        handlersRef.current.onMessageUpdate(outputBuffer.current, 'assistant');
                        outputBuffer.current = "";
                    }
                }

                // Handle Tool Calls
                if (msg.toolCall) {
                    const responses = [];
                    for (const call of msg.toolCall.functionCalls) {
                        console.log("Tool Call:", call.name, call.args);
                        let result = { status: "ok" };
                        
                        if (call.name === "navigateToOracle") {
                            handlersRef.current.onNavigateOracle();
                        } else if (call.name === "navigateToHome") {
                            handlersRef.current.onNavigateHome();
                        } else if (call.name === "changeLanguage") {
                            const lang = (call.args as any).language;
                            if (lang) handlersRef.current.onChangeLanguage(lang as Language);
                        }

                        responses.push({
                            id: call.id,
                            name: call.name,
                            response: result
                        });
                    }
                    
                    sessionPromise.then(session => {
                       session.sendToolResponse({ functionResponses: responses });
                    });
                }
            },
            onclose: () => {
                console.log("Live Session Closed");
                disconnect();
            },
            onerror: (err) => {
                console.error("Live Session Error", err);
                setError("generic");
                disconnect();
            }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Connection Failed", e);
      setError("generic");
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
        try {
             // sessionRef.current.close(); 
        } catch(e) {
            console.warn("Error closing session", e);
        }
    }
    if (recorderRef.current) {
        recorderRef.current.stop();
    }
    if (playerRef.current) {
        playerRef.current.stop();
    }
    setIsConnected(false);
    setIsSpeaking(false);
    sessionRef.current = null;
  };

  return {
    isConnected,
    isSpeaking,
    error,
    connect,
    disconnect
  };
};
