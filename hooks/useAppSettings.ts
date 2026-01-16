
import { useState, useEffect } from 'react';

export interface ProcessConfig {
  id: string;
  label: string;
  isEnabled: boolean;
  customPrompt: string; // Specific instruction for this process
}

export interface AppSettings {
  // We map keys (packet, letter) to their config
  processes: Record<string, ProcessConfig>;
  
  assistant: {
    voiceName: string;
    politeness: 'formal' | 'casual';
    responseLength: 'short' | 'medium' | 'long';
    // Knowledge Base: The source of truth
    knowledgeBase: string;
    // Base Prompt: Global personality instructions
    globalPrompt: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  processes: {
    packet: { 
      id: 'packet', 
      label: 'Paket aufgeben', 
      isEnabled: true, 
      customPrompt: 'Unterstütze beim Wiegen und der Adressierung. Erwähne Versandarten (Economy/Priority).' 
    },
    letter: { 
      id: 'letter', 
      label: 'Brief versenden', 
      isEnabled: true, 
      customPrompt: 'Fasse dich sehr kurz. Der Kunde kennt sich meistens aus. Hilf nur bei Formaten (A-Post/B-Post).' 
    },
    payment: { 
      id: 'payment', 
      label: 'Einzahlung', 
      isEnabled: true, 
      customPrompt: 'Führe den Kunden präzise durch den Scan-Vorgang. Sicherheit ist wichtig.' 
    },
    tracking: { 
      id: 'tracking', 
      label: 'Sendungsverfolgung', 
      isEnabled: true, 
      customPrompt: 'Frage direkt nach der Sendungsnummer, falls noch nicht eingegeben.' 
    },
  },
  assistant: {
    voiceName: 'Puck',
    politeness: 'formal',
    responseLength: 'short',
    knowledgeBase: `
OFFIZIELLES WISSEN SCHWEIZER POST:
- PostPac Economy: Zustellung in 2 Werktagen. Günstig.
- PostPac Priority: Zustellung am nächsten Werktag. Schnell.
- Briefe: A-Post (Nächster Tag), B-Post (max 3 Tage).
- Einzahlungen: Nur mit Karte möglich am Self-Service. Kein Bargeld.
- Öffnungszeiten Support: 08:00 - 18:00 Uhr.
    `.trim(),
    globalPrompt: 'Sei ein zurückhaltender, freundlicher Begleiter. Dränge dich nicht auf.',
  },
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load initial from local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('post_app_settings_v2');
      if (saved) {
        try {
          // Merge with defaults to ensure new fields exist
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            processes: { ...DEFAULT_SETTINGS.processes, ...parsed.processes },
            assistant: { ...DEFAULT_SETTINGS.assistant, ...parsed.assistant }
          };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save to local storage whenever settings change
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('post_app_settings_v2', JSON.stringify(newSettings));
  };

  const updateProcessConfig = (key: string, updates: Partial<ProcessConfig>) => {
    const currentProc = settings.processes[key];
    if (!currentProc) return;

    const newSettings = {
      ...settings,
      processes: {
        ...settings.processes,
        [key]: { ...currentProc, ...updates }
      }
    };
    updateSettings(newSettings);
  };

  const updateAssistant = (key: keyof AppSettings['assistant'], value: any) => {
      const newSettings = {
          ...settings,
          assistant: { ...settings.assistant, [key]: value }
      };
      updateSettings(newSettings);
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'post_app_settings_v2' && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { settings, updateProcessConfig, updateAssistant };
};
