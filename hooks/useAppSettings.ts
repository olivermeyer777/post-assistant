
import { useState, useEffect } from 'react';

export interface AppSettings {
  processes: {
    packet: boolean;
    letter: boolean;
    payment: boolean;
    tracking: boolean;
  };
  assistant: {
    voiceName: string;
    politeness: 'formal' | 'casual';
    responseLength: 'short' | 'medium' | 'long';
    supportStyle: 'reactive' | 'medium' | 'proactive';
    customPrompt: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  processes: {
    packet: true,
    letter: true,
    payment: true,
    tracking: true,
  },
  assistant: {
    voiceName: 'Puck',
    politeness: 'formal',
    responseLength: 'short',
    supportStyle: 'medium',
    customPrompt: '',
  },
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load initial from local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('post_app_settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save to local storage whenever settings change
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('post_app_settings', JSON.stringify(updated));
  };

  const updateProcess = (key: keyof AppSettings['processes'], value: boolean) => {
    const updated = {
        ...settings,
        processes: { ...settings.processes, [key]: value }
    };
    updateSettings(updated);
  };

  const updateAssistant = (key: keyof AppSettings['assistant'], value: any) => {
      const updated = {
          ...settings,
          assistant: { ...settings.assistant, [key]: value }
      };
      updateSettings(updated);
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'post_app_settings' && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { settings, updateSettings, updateProcess, updateAssistant };
};
