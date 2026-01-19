
import { useState, useEffect } from 'react';

export interface ProcessConfig {
  id: string;
  label: string;
  isEnabled: boolean;
  customPrompt: string; 
  // Process-specific overrides
  responseLength: 'short' | 'medium' | 'long';
  supportIntensity: 'passive' | 'proactive';
}

export interface AppSettings {
  processes: Record<string, ProcessConfig>;
  assistant: {
    voiceName: string;
    politeness: 'formal' | 'casual';
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
      customPrompt: 'Unterstütze beim Wiegen und der Adressierung.',
      responseLength: 'medium',
      supportIntensity: 'proactive'
    },
    letter: { 
      id: 'letter', 
      label: 'Brief versenden', 
      isEnabled: true, 
      customPrompt: 'Der Kunde kennt sich meistens aus. Hilf nur bei Formaten.',
      responseLength: 'short',
      supportIntensity: 'passive'
    },
    payment: { 
      id: 'payment', 
      label: 'Einzahlung', 
      isEnabled: true, 
      customPrompt: 'Führe den Kunden präzise durch den Scan-Vorgang. Sicherheit ist wichtig.',
      responseLength: 'short',
      supportIntensity: 'proactive'
    },
    tracking: { 
      id: 'tracking', 
      label: 'Sendungsverfolgung', 
      isEnabled: true, 
      customPrompt: 'Frage direkt nach der Sendungsnummer.',
      responseLength: 'short',
      supportIntensity: 'passive'
    },
  },
  assistant: {
    voiceName: 'Puck',
    politeness: 'formal',
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
      const saved = localStorage.getItem('post_app_settings_v3'); // Bumped version
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Deep merge manually to ensure structure safety
          return {
            ...DEFAULT_SETTINGS,
            assistant: { ...DEFAULT_SETTINGS.assistant, ...parsed.assistant },
            processes: {
                packet: { ...DEFAULT_SETTINGS.processes.packet, ...(parsed.processes?.packet || {}) },
                letter: { ...DEFAULT_SETTINGS.processes.letter, ...(parsed.processes?.letter || {}) },
                payment: { ...DEFAULT_SETTINGS.processes.payment, ...(parsed.processes?.payment || {}) },
                tracking: { ...DEFAULT_SETTINGS.processes.tracking, ...(parsed.processes?.tracking || {}) },
            }
          };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('post_app_settings_v3', JSON.stringify(newSettings));
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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'post_app_settings_v3' && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { settings, updateProcessConfig, updateAssistant };
};
