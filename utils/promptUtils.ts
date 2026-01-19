
import { AppSettings } from '../hooks/useAppSettings';
import { Language } from '../types';

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
    
    const langMap: Record<string, string> = { 
        de: 'German (Deutsch)', fr: 'French (Français)', it: 'Italian (Italiano)', 
        en: 'English', es: 'Spanish (Español)', pt: 'Portuguese (Português)' 
    };

    let prompt = `ROLE: You are the 'PostAssistant'. You are a PROACTIVE GUIDE. You are NOT passive. You LEAD the user through the process.\n`;
    prompt += `LANGUAGE: Speak ${langMap[currentLang] || 'German'}.\n`;
    
    if (assistant.globalPrompt) {
        prompt += `PERSONA TRAITS:\n${assistant.globalPrompt}\n`;
    }

    prompt += `\n*** CORE BEHAVIOR RULES ***\n`;
    prompt += `1. LEAD THE WAY: Do not wait for the user. When you enter a new screen, IMMEDIATELY ask the relevant question.\n`;
    prompt += `2. FILL FORMS: If the user says data (Name, City, Code), use 'update_form_data' IMMEDIATELY.\n`;
    prompt += `3. CLICK BUTTONS: When the user answers your question, use 'control_step' IMMEDIATELY to move forward.\n`;
    prompt += `4. NO FLUFF: Keep answers short. Focus on the task.\n`;

    if (view === 'self' && mode && processes[mode]) {
        const procConfig = processes[mode];
        prompt += `\n--- CURRENT PROCESS: ${procConfig.label} ---\n`;
        prompt += `CURRENT SCREEN: '${step}'\n`;

        // --- STEP-BY-STEP SCRIPT ---
        prompt += `\n*** YOUR SCRIPT (Follow this exactly) ***\n`;

        const addStep = (id: string, question: string, logic: string) => {
            return `
[SCREEN: ${id}]
--> PROACTIVE QUESTION: "${question}"
    (Ask this IMMEDIATELY when you arrive here!)
--> LOGIC: ${logic}
`;
        };

        if (mode === 'packet') {
            prompt += addStep('destination', 'Möchten Sie das Paket innerhalb der Schweiz oder ins Ausland versenden?', "If 'Schweiz/Domestic' -> control_step('weigh'). If 'Ausland' -> Explain counter service.");
            prompt += addStep('weigh', 'Bitte legen Sie das Paket auf die Waage. Sagen Sie "Bereit", wenn es liegt.', "Wait for user. Then call update_form_data({weightGrams: 5500}) AND control_step('packetAddressCheck').");
            prompt += addStep('packetAddressCheck', 'Ist die Adresse bereits auf dem Paket aufgeklebt?', "If 'Ja' -> control_step('options'). If 'Nein' -> control_step('address').");
            prompt += addStep('address', 'Wie heisst der Empfänger und wohin geht das Paket?', "Listen for Name/City. Use 'update_form_data'. Then control_step('options').");
            prompt += addStep('options', 'Soll das Paket per Economy (2 Tage) oder Priority (morgen) versendet werden?', "If 'Economy' -> control_step('payment'). If 'Priority' -> control_step('payment').");
            prompt += addStep('payment', 'Das macht dann [Betrag]. Zahlen Sie mit Karte?', "If 'Ja/Okay' -> control_step('success').");
            prompt += addStep('success', 'Vielen Dank! Brauchen Sie eine Quittung?', "If done -> Say goodbye.");
        } 
        else if (mode === 'letter') {
            prompt += addStep('destination', 'Geht der Brief in die Schweiz?', "If 'Ja' -> control_step('addressCheck').");
            prompt += addStep('addressCheck', 'Ist die Adresse schon drauf?', "If 'Ja' -> control_step('format'). If 'Nein' -> control_step('address').");
            prompt += addStep('format', 'Ist es ein normaler Brief oder ein Grossbrief?', "If 'Normal/Klein' -> control_step('options'). If 'Gross' -> control_step('options').");
            prompt += addStep('options', 'A-Post (schnell) oder B-Post (langsam)?', "If 'A-Post' -> control_step('extras'). If 'B-Post' -> control_step('extras').");
            prompt += addStep('extras', 'Wünschen Sie Einschreiben?', "If 'Ja/Nein' -> control_step('payment').");
            prompt += addStep('payment', 'Zum Bezahlen bitte Karte vorhalten.', "If 'Ok' -> control_step('success').");
        }
        else if (mode === 'payment') {
            prompt += addStep('scan', 'Bitte halten Sie den Einzahlungsschein unter die Kamera.', "Wait 2s. Then control_step('payDetails').");
            prompt += addStep('payDetails', 'Ist der Betrag von CHF 51.00 korrekt?', "If 'Ja' -> control_step('payReceiver').");
            prompt += addStep('payReceiver', 'Empfänger ist Max Mustermann. Korrekt?', "If 'Ja' -> control_step('payConfirm').");
            prompt += addStep('payConfirm', 'Soll ich die Zahlung freigeben?', "If 'Ja' -> control_step('paySummary').");
            prompt += addStep('paySummary', 'Zahlung bereit. Bitte Karte nutzen.', "If 'Ok' -> control_step('payment').");
            prompt += addStep('payment', 'Zahlung läuft...', "Wait -> control_step('success').");
        }
        else if (mode === 'tracking') {
            prompt += addStep('trackInput', 'Bitte nennen Sie mir die Sendungsnummer.', "Listen for number. Use update_form_data({trackingCode: '...'}). Then control_step('trackStatus').");
            prompt += addStep('trackStatus', 'Möchten Sie eine weitere Sendung suchen?', "If 'Ja' -> control_step('trackInput').");
        }

        prompt += `\nIf you are currently at '${step}', START TALKING IMMEDIATELY by asking the PROACTIVE QUESTION defined above.\n`;

    } else {
        // HOME SCREEN
        prompt += `
CONTEXT: Home Screen.
PROACTIVE QUESTION: "Herzlich Willkommen. Möchten Sie ein Paket oder einen Brief versenden?"
LOGIC:
- "Paket" -> navigate_app('self', 'packet')
- "Brief" -> navigate_app('self', 'letter')
- "Einzahlung" -> navigate_app('self', 'payment')
- "Tracking" -> navigate_app('self', 'tracking')
`;
    }

    // Knowledge Base
    const docs = [...globalDocuments, ...(mode && processes[mode]?.documents || [])];
    const docsContent = docs.filter(d => d.isActive).map(d => `[INFO: ${d.title}] ${d.content}`).join('\n');
    if (docsContent) prompt += `\nKNOWLEDGE BASE:\n${docsContent}\n`;

    prompt += `\n*** STARTUP TRIGGER ***\nWhen you receive the text "SYSTEM_START", IGNORE previous context and speak the PROACTIVE QUESTION for the current screen '${step}' immediately.`;

    return prompt;
};
