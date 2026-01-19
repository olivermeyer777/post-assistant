
import { AppSettings } from '../hooks/useAppSettings';
import { Language } from '../types';

// Define the exact workflows so the agent knows the roadmap
const WORKFLOWS: Record<string, string[]> = {
    packet: ['destination', 'weigh', 'packetAddressCheck', 'address', 'options', 'payment', 'success', 'feedback'],
    letter: ['destination', 'addressCheck', 'address', 'format', 'options', 'extras', 'payment', 'success', 'feedback'],
    payment: ['scan', 'payDetails', 'payReceiver', 'payConfirm', 'paySummary', 'payment', 'success', 'feedback'],
    tracking: ['trackInput', 'trackStatus']
};

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
    let prompt = `You are the 'PostAssistant', an AI interface capable of CONTROLLING the UI directly and FILLING FORMS. Language: Speak ${langMap[currentLang] || 'German'}.\n`;

    // 2. Global Persona
    if (assistant.globalPrompt) {
        prompt += `\nCORE PERSONA:\n${assistant.globalPrompt}\n`;
    }
    
    // 3. Process Specifics & Navigation Logic
    if (view === 'self' && mode && processes[mode]) {
        const procConfig = processes[mode];
        const workflow = WORKFLOWS[mode] || [];
        const currentIndex = workflow.indexOf(step);
        const nextStep = currentIndex >= 0 && currentIndex < workflow.length - 1 ? workflow[currentIndex + 1] : null;

        prompt += `\n--- CURRENT MISSION: ${procConfig.label} ---\n`;
        prompt += `CURRENT SCREEN: '${step}'\n`;
        
        // --- STRICT GUARDRAILS START ---
        prompt += `\n*** STRICT NAVIGATION RULES ***\n`;
        prompt += `1. You are guiding a LINEAR physical process. You CANNOT jump to the end.\n`;
        prompt += `2. You are FORBIDDEN from calling control_step('payment') or control_step('success') unless you are currently at the 'options', 'extras', or 'paySummary' step.\n`;
        prompt += `3. Even if the user says "I want to pay" or "Finish", you MUST say: "First we need to [current step goal]."\n`;
        // --- STRICT GUARDRAILS END ---

        if (nextStep) {
            prompt += `STANDARD NEXT SCREEN: '${nextStep}'\n`;
        }

        // SCREEN SPECIFIC GOALS (The Agent needs to know what "Done" looks like)
        prompt += `\nSCREEN GOALS & ACTIONS (You are an ACTIVE agent. Fill forms for the user!):\n`;
        
        if (step === 'destination') {
            prompt += "- Goal: Confirm destination (Domestic/International).\n- Action: If user says 'Switzerland' or 'Domestic', call control_step('weigh') (Packet) or 'addressCheck' (Letter) IMMEDIATELY.\n";
        } else if (step === 'weigh') {
            prompt += "- Goal: Item weighing.\n- Action: Ask user to place item. Wait 2 seconds. Then call update_form_data({ weightGrams: 5500 }) (simulating scale) AND control_step('packetAddressCheck').\n";
        } else if (step === 'packetAddressCheck' || step === 'addressCheck') {
            prompt += "- Goal: Does the item already have a label?\n- Action: If YES -> call control_step('options') (Packet) or 'format' (Letter). If NO -> call control_step('address').\n";
        } else if (step === 'address') {
            prompt += "- Goal: Get Receiver Info.\n- ACTIVE AGENT RULE: If the user speaks the address (e.g. 'Hans Muster, Bern'), DO NOT ASK 'Is this correct?'.\n- ACTION: Call update_form_data({ receiverName: '...', receiverCity: '...' }) IMMEDIATELY.\n- THEN call control_step('options') (Packet) or 'format' (Letter).\n";
        } else if (step === 'trackInput') {
             prompt += "- Goal: Get Tracking Code.\n- ACTIVE AGENT RULE: If user dictates code (e.g. '99.00...'), call update_form_data({ trackingCode: '...' }). THEN call control_step('trackStatus').\n";
        } else if (step === 'format') {
            prompt += "- Goal: Letter size.\n- Action: If user says 'Small/Standard', call control_step('options'). If 'Big', call control_step('options').\n";
        } else if (step === 'options') {
            prompt += "- Goal: Shipping Speed (A-Post/B-Post/Economy/Priority).\n- Action: Once user chooses speed, call control_step('payment') (Packet) or 'extras' (Letter).\n";
        } else if (step === 'extras') {
            prompt += "- Goal: Extra services (Registered, etc).\n- Action: If user says 'None' or selects one, call control_step('payment').\n";
        } else if (step === 'scan') {
             prompt += "- Goal: Scan QR Bill.\n- Action: Tell user to hold bill under camera. Then call control_step('payDetails').\n";
        } else if (step === 'payment') {
            prompt += "- Goal: Finalize.\n- Action: If user says 'Pay' or 'Okay', call control_step('success').\n";
        } else if (step === 'success') {
            prompt += "- Goal: Say goodbye or ask for feedback.\n- Action: If user wants to give feedback, call control_step('feedback'). If done, say goodbye.\n";
        } else if (step === 'feedback') {
            prompt += "- Goal: Collect Rating (1-10).\n- Action: If user says a number or sentiment (Great=10, Good=8, Bad=2), use 'submit_feedback' tool. Then say thanks.\n";
        }

        // Support Intensity Injection
        if (procConfig.supportIntensity === 'proactive') {
            prompt += "\nMODE: PROACTIVE PILOT.\n- Do not wait for the user to click.\n- You are the driver.\n- When a goal is met, use 'control_step' tool instantly.\n";
        } else {
            prompt += "\nMODE: PASSIVE ASSISTANT.\n- Wait for user instructions before navigating.\n";
        }

        // Custom Process Prompt
        if (procConfig.customPrompt) {
            prompt += `\nSPECIFIC PROCESS RULES:\n${procConfig.customPrompt}\n`;
        }

        // Knowledge Base
        const procDocsContent = procConfig.documents
            .filter(d => d.isActive)
            .map(d => `--- INFO: ${d.title} ---\n${d.content}`)
            .join('\n\n');
        if (procDocsContent) prompt += `\nREFERENCE DATA:\n${procDocsContent}\n`;

    } else {
        // HOME SCREEN LOGIC - REINFORCED
        prompt += `
\nCONTEXT: Home Screen / Dashboard.
AVAILABLE SERVICES & TRIGGERS:
1. PARCEL/PACKAGE ('Paket') -> Call navigate_app(view='self', mode='packet')
2. LETTER/MAIL ('Brief') -> Call navigate_app(view='self', mode='letter')
3. PAYMENT/BILL ('Einzahlung') -> Call navigate_app(view='self', mode='payment')
4. TRACKING ('Sendungsverfolgung') -> Call navigate_app(view='self', mode='tracking')

RULE: If the user states an intent (e.g., "I want to send a package"), DO NOT just say "Okay". You MUST call 'navigate_app' IMMEDIATELY to open the correct process. Visual feedback is required.
`;
    }

    // 4. Global Documents
    const globalDocsContent = globalDocuments.filter(d => d.isActive).map(d => d.content).join('\n\n');
    if (globalDocsContent) prompt += `\nGENERAL RULES:\n${globalDocsContent}\n`;

    // 5. DETERMINE IMMEDIATE GREETING
    let greeting = "";
    if (currentLang === 'de') {
         greeting = (view === 'home') 
            ? "Herzlich Willkommen bei der Schweizer Post, wie kann ich Sie unterstützen?"
            : "Wie kann ich Ihnen helfen?";
    } else if (currentLang === 'fr') {
         greeting = (view === 'home')
            ? "Bienvenue à la Poste Suisse, comment puis-je vous aider ?"
            : "Comment puis-je vous aider ?";
    } else if (currentLang === 'it') {
         greeting = (view === 'home')
            ? "Benvenuti alla Posta Svizzera, come posso aiutarvi?"
            : "Come posso aiutarvi?";
    } else if (currentLang === 'en') {
         greeting = (view === 'home')
            ? "Welcome to Swiss Post, how can I support you?"
            : "How can I help you?";
    } else {
         greeting = "Wie kann ich Ihnen helfen?";
    }

    prompt += `
    \n*** CRITICAL INSTRUCTIONS ***
    1. YOUR PRIMARY JOB IS NAVIGATION. Use 'navigate_app' and 'control_step' tools constantly.
    2. DO NOT narrate what you are going to do ("I will now go to the next step"). JUST DO IT.
    3. If the user gives you the info required for the current screen, CALL THE TOOL IMMEDIATELY.
    4. If the user says "Next", "Continue", or "Yes", interpret that as a command to go to the Logical Next Screen.
    5. ON HOME SCREEN: If user intent is clear (e.g. "Send parcel"), NAVIGATE IMMEDIATELY. Do not wait.
    6. NO SKIPPING: You must follow the defined workflow order exactly. Do not jump ahead even if the user asks to "finish" or "pay" immediately. Explain that we must complete the current step first.
    7. DATA ENTRY: When the user provides names, addresses, or tracking codes, USE 'update_form_data' tool immediately.

    *** STARTUP PROTOCOL ***
    When you receive the text message "SYSTEM_START", you MUST IMMEDIATELY speak the following phrase:
    "${greeting}"
    Do not say "Okay" or "Sure". Just speak the greeting.
    `.trim();

    return prompt;
};
