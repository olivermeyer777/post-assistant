
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || ""; 
// Note: In a real production app, we wouldn't hardcode or expect the key to be empty. 
// The UI will show a fallback if no key is present.

const genAI = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are the official AI Assistant for "Schweizer Post" (Swiss Post).
Your goal is to answer customer questions accurately using ONLY information found on the Swiss Post website (post.ch).
You have access to Google Search Grounding. 

RULES:
1. PRIORITIZE information from 'post.ch'.
2. Keep answers concise, friendly, and helpful.
3. If you cannot find the answer on post.ch or via search, politely say you don't know and suggest visiting a branch.
4. Formatting: Use clear paragraphs. Do NOT use Markdown headers like ##.
5. Language: Always answer in the language the user spoke to you in.

IMPORTANT: If you can suggest specific next steps or actions based on the user's query, you MUST list them at the very end of your response.
Format the list exactly like this: 
BUTTONS: Option 1 | Option 2 | Option 3

Example response:
"You can track your package online using the tracking number."
BUTTONS: Track Package | Find Branch
`;

export interface GeminiResponse {
  text: string;
  sources?: Array<{ title: string; uri: string }>;
}

export const sendMessageToGemini = async (
  message: string, 
  languageContext: string
): Promise<GeminiResponse> => {
  if (!API_KEY) {
    return { 
        text: "Simulated Response (No API Key): I can help you with Swiss Post services. \nBUTTONS: Track Package | Find Branch | Change Address" 
    };
  }

  try {
    const model = genAI.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Language Context: ${languageContext}. User Query: ${message}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable Grounding
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }
    
    // Extract Grounding Metadata (Sources)
    let sources: Array<{ title: string; uri: string }> = [];
    
    // The SDK structure for grounding chunks might vary slightly, usually found in candidates[0].groundingMetadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Swiss Post Source",
            uri: chunk.web.uri
          });
        }
      });
    }
    
    // Filter sources to prefer post.ch if possible, or just return unique ones
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
        text: response.text,
        sources: uniqueSources.length > 0 ? uniqueSources : undefined
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
