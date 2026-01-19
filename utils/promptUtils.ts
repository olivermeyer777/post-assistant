
import { AppSettings } from '../hooks/useAppSettings';
import { Language } from '../types';

export const buildSystemInstruction = (
    currentLang: Language,
    settings: AppSettings,
    context: { view: string; mode: string; step: string }
): string => {
    const { assistant, globalDocuments, processes } = settings;
    const { view, mode, step } = context;
    
    // 1. Language & Identity
    const langMap: Record<string, string> = { 
        de: 'German (Deutsch)', fr: 'French (Français)', it: 'Italian (Italiano)', 
        en: 'English', es: 'Spanish (Español)', pt: 'Portuguese (Português)' 
    };
    let prompt = `You are the 'PostAssistant' for Swiss Post. Language: Speak ${langMap[currentLang] || 'German'}.\n`;

    // 2. Global Persona & Politeness
    if (assistant.globalPrompt) {
        prompt += `\nCORE PERSONA:\n${assistant.globalPrompt}\n`;
    }
    
    const politenessInstruction = assistant.politeness === 'casual' 
        ? "Tone: Casual, friendly. Use 'Du' (German) / 'Tu' (French/Italian)." 
        : "Tone: Formal, professional. Use 'Sie' (German) / 'Vous' (French) / 'Lei' (Italian).";
    prompt += `${politenessInstruction}\n`;

    // 3. Global Knowledge Base (Active Docs)
    const globalDocsContent = globalDocuments
        .filter(d => d.isActive)
        .map(d => `--- DOC: ${d.title} ---\n${d.content}`)
        .join('\n\n');
        
    if (globalDocsContent) {
        prompt += `\nGLOBAL KNOWLEDGE BASE:\n${globalDocsContent}\n`;
    }

    // 4. Process-Specific Configuration (Context Aware)
    // Check if we are in a specific process view (self) and have a valid mode
    if (view === 'self' && mode && processes[mode]) {
        const procConfig = processes[mode];

        if (procConfig.isEnabled) {
            prompt += `\nCURRENT PROCESS CONTEXT: User is in '${procConfig.label}' (Step: ${step}).\n`;

            // Support Intensity
            if (procConfig.supportIntensity === 'proactive') {
                prompt += "Interaction Style: PROACTIVE. Guide the user step-by-step. Ask for missing information immediately. Do not wait for the user to ask what to do next.\n";
            } else {
                prompt += "Interaction Style: PASSIVE. Wait for the user to ask questions. Do not offer unrequested advice.\n";
            }

            // Response Length
            if (procConfig.responseLength === 'short') {
                prompt += "Response Length: VERY SHORT. Telegram style. Max 10 words if possible.\n";
            } else if (procConfig.responseLength === 'long') {
                prompt += "Response Length: DETAILED. Explain concepts thoroughly.\n";
            } else {
                prompt += "Response Length: CONCISE. 1-2 sentences max.\n";
            }

            // Custom Process Prompt
            if (procConfig.customPrompt) {
                prompt += `\nPROCESS RULES:\n${procConfig.customPrompt}\n`;
            }

            // Process Knowledge Base
            const procDocsContent = procConfig.documents
                .filter(d => d.isActive)
                .map(d => `--- PROCESS DOC: ${d.title} ---\n${d.content}`)
                .join('\n\n');
            
            if (procDocsContent) {
                prompt += `\nPROCESS KNOWLEDGE:\n${procDocsContent}\n`;
            }
        }
    } else {
        // Not in a specific process or on Home
        prompt += "\nCONTEXT: User is on the Home Screen / Dashboard.\n";
    }

    // 5. Critical Navigation Rules (ALWAYS APPLIED)
    // These rules are essential for the agent to behave as an app controller.
    prompt += `
    \nCRITICAL FUNCTIONAL RULES:
    1. You have FULL CONTROL over the app navigation via tools. 
    2. If the user wants to perform an action (e.g., "Send a package", "Track shipment"), DO NOT explain how to do it textually.
    3. INSTEAD, IMMEDIATELY USE the 'navigate_app' tool to take them there.
    4. Be proactive with tools. Act first, talk later.
    `.trim();

    return prompt;
};
