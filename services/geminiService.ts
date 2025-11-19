
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || ""; 
// Note: In a real production app, we wouldn't hardcode or expect the key to be empty. 
// The UI will show a fallback if no key is present.

const genAI = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are a helpful assistant for "Schweizer Post" (Swiss Post). 
Your tone is friendly, professional, and concise.
You help users with tracking packages, address changes, finding branches, and general postal inquiries.

IMPORTANT: If you can suggest specific next steps or actions based on the user's query, you MUST list them at the very end of your response.
Format the list exactly like this: 
BUTTONS: Option 1 | Option 2 | Option 3

Example response:
"You can track your package online using the tracking number."
BUTTONS: Track Package | Find Branch

If there are no specific buttons to suggest, do not include the BUTTONS: line.
Always reply in the language the user spoke to you in, or default to the context language if provided.
`;

export const sendMessageToGemini = async (
  message: string, 
  languageContext: string
): Promise<string> => {
  if (!API_KEY) {
    return "Simulated Response (No API Key): I can help you with Swiss Post services. \nBUTTONS: Track Package | Find Branch | Change Address";
  }

  try {
    const model = genAI.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Language Context: ${languageContext}. User Query: ${message}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
