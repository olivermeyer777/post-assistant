
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

export interface ProcessConfig {
  id: string;
  label: string;
  isEnabled: boolean;
  customPrompt: string; 
  responseLength: 'short' | 'medium' | 'long';
  supportIntensity: 'passive' | 'proactive';
  documents: KnowledgeDocument[];
}

export interface AppSettings {
  globalDocuments: KnowledgeDocument[];
  processes: Record<string, ProcessConfig>;
  assistant: {
    voiceName: string;
    politeness: 'formal' | 'casual';
    knowledgeBase: string; // Deprecated but kept for type safety
    globalPrompt: string;
  };
}

// Default Fallback to avoid crashes before data load
const DEFAULT_SETTINGS: AppSettings = {
  globalDocuments: [],
  processes: {
    packet: { id: 'packet', label: 'Paket aufgeben', isEnabled: true, customPrompt: '', responseLength: 'medium', supportIntensity: 'proactive', documents: [] },
    letter: { id: 'letter', label: 'Brief versenden', isEnabled: true, customPrompt: '', responseLength: 'short', supportIntensity: 'passive', documents: [] },
    payment: { id: 'payment', label: 'Einzahlung', isEnabled: true, customPrompt: '', responseLength: 'short', supportIntensity: 'proactive', documents: [] },
    tracking: { id: 'tracking', label: 'Sendungsverfolgung', isEnabled: true, customPrompt: '', responseLength: 'short', supportIntensity: 'passive', documents: [] },
  },
  assistant: {
    voiceName: 'Puck',
    politeness: 'formal',
    knowledgeBase: '',
    globalPrompt: '',
  },
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchSettings = useCallback(async () => {
    try {
      const isCriticalError = (error: any) => {
          if (!error) return false;
          const ignoredCodes = ['PGRST116', '42P01', 'MISSING_CONFIG'];
          return !ignoredCodes.includes(error.code);
      };

      // 1. Fetch Global Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .single();
        
      if (isCriticalError(settingsError)) {
          console.warn(`Supabase: Failed to load settings. Using defaults. Code: ${settingsError?.code}`);
      }

      // 2. Fetch Processes
      const { data: processData } = await supabase
        .from('processes')
        .select('*');

      // 3. Fetch All Documents
      const { data: docData } = await supabase
        .from('knowledge_documents')
        .select('*');

      // --- ASSEMBLE DATA ---
      const newSettings: AppSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

      // Apply Global Settings
      if (settingsData) {
        newSettings.assistant.voiceName = settingsData.voice_name || 'Puck';
        newSettings.assistant.politeness = settingsData.politeness || 'formal';
        newSettings.assistant.globalPrompt = settingsData.global_prompt || '';
      }

      // Apply Global Docs
      if (docData && Array.isArray(docData)) {
        newSettings.globalDocuments = docData
            .filter((d: any) => d.scope === 'global')
            .map((d: any) => ({
                id: d.id,
                title: d.title,
                content: d.content,
                isActive: d.is_active
            }));
      }

      // Apply Process Configs & Process Docs
      if (processData && Array.isArray(processData)) {
        processData.forEach((p: any) => {
            if (newSettings.processes[p.process_key]) {
                newSettings.processes[p.process_key].isEnabled = p.is_enabled;
                newSettings.processes[p.process_key].customPrompt = p.custom_prompt || '';
                newSettings.processes[p.process_key].responseLength = p.response_length || 'medium';
                newSettings.processes[p.process_key].supportIntensity = p.support_intensity || 'proactive';
                
                // Filter docs for this process
                if (docData && Array.isArray(docData)) {
                    newSettings.processes[p.process_key].documents = docData
                        .filter((d: any) => d.scope === 'process' && d.process_key === p.process_key)
                        .map((d: any) => ({
                            id: d.id,
                            title: d.title,
                            content: d.content,
                            isActive: d.is_active
                        }));
                }
            }
        });
      }

      setSettings(newSettings);
      setLoading(false);

    } catch (error) {
      console.warn("Supabase Fetch Exception:", error);
      setLoading(false);
    }
  }, []);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    // Initial Load
    fetchSettings();

    let channel: any = null;

    try {
        // Only attempt subscription if channel method exists (Safe Mocking)
        if (supabase.channel) {
            channel = supabase.channel('schema-db-changes')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => fetchSettings())
              .on('postgres_changes', { event: '*', schema: 'public', table: 'processes' }, () => fetchSettings())
              .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_documents' }, () => fetchSettings())
              .subscribe();
        }
    } catch (e) {
        console.warn("Realtime subscription failed (Offline mode?)", e);
    }

    return () => {
      if (supabase.removeChannel && channel) {
          supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [fetchSettings]);

  // --- UPDATE FUNCTIONS ---

  const updateAssistant = async (key: keyof AppSettings['assistant'], value: any) => {
      // Optimistic Update
      setSettings(prev => ({
          ...prev,
          assistant: { ...prev.assistant, [key]: value }
      }));

      // DB Update
      const dbKeyMap: Record<string, string> = {
          voiceName: 'voice_name',
          politeness: 'politeness',
          globalPrompt: 'global_prompt'
      };

      if (dbKeyMap[key]) {
          try {
             await supabase.from('app_settings').update({ [dbKeyMap[key]]: value }).gt('id', 0);
          } catch (e) { console.warn("Update assistant settings failed (Offline)", e); }
      }
  };

  const updateProcessConfig = async (key: string, updates: Partial<ProcessConfig>) => {
      // Optimistic
      setSettings(prev => {
          const current = prev.processes[key];
          if (!current) return prev;
          return {
              ...prev,
              processes: { ...prev.processes, [key]: { ...current, ...updates } }
          };
      });

      // DB Update mapping
      const dbUpdates: any = {};
      if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
      if (updates.customPrompt !== undefined) dbUpdates.custom_prompt = updates.customPrompt;
      if (updates.responseLength !== undefined) dbUpdates.response_length = updates.responseLength;
      if (updates.supportIntensity !== undefined) dbUpdates.support_intensity = updates.supportIntensity;

      if (Object.keys(dbUpdates).length > 0) {
          try {
             await supabase.from('processes').update(dbUpdates).eq('process_key', key);
          } catch (e) { console.warn("Update process config failed (Offline)", e); }
      }
  };

  // --- DOCUMENT FUNCTIONS ---

  const addGlobalDocument = async (doc: KnowledgeDocument) => {
      // Optimistic First
      setSettings(prev => ({
          ...prev,
          globalDocuments: [...prev.globalDocuments, doc]
      }));
      try {
        await supabase.from('knowledge_documents').insert({
            title: doc.title,
            content: doc.content,
            scope: 'global',
            is_active: true
        });
      } catch (e) { console.warn("Add doc failed (Offline)", e); }
  };

  const removeGlobalDocument = async (id: string) => {
      setSettings(prev => ({
          ...prev,
          globalDocuments: prev.globalDocuments.filter(d => d.id !== id)
      }));
      try {
        await supabase.from('knowledge_documents').delete().eq('id', id);
      } catch (e) { console.warn("Delete document failed (Offline)", e); }
  };

  const addProcessDocument = async (processKey: string, doc: KnowledgeDocument) => {
      setSettings(prev => {
          const proc = prev.processes[processKey];
          if (!proc) return prev;
          return {
              ...prev,
              processes: {
                  ...prev.processes,
                  [processKey]: { ...proc, documents: [...proc.documents, doc] }
              }
          };
      });
      try {
        await supabase.from('knowledge_documents').insert({
            title: doc.title,
            content: doc.content,
            scope: 'process',
            process_key: processKey,
            is_active: true
        });
      } catch (e) { console.warn("Add process doc failed (Offline)", e); }
  };

  const removeProcessDocument = async (processKey: string, docId: string) => {
      setSettings(prev => {
          const proc = prev.processes[processKey];
          if (!proc) return prev;
          return {
              ...prev,
              processes: {
                  ...prev.processes,
                  [processKey]: { ...proc, documents: proc.documents.filter(d => d.id !== docId) }
              }
          };
      });
      try {
         await supabase.from('knowledge_documents').delete().eq('id', docId);
      } catch (e) { console.warn("Delete process doc failed (Offline)", e); }
  };

  return { 
      settings, 
      loading,
      updateProcessConfig, 
      updateAssistant,
      addGlobalDocument,
      removeGlobalDocument,
      addProcessDocument,
      removeProcessDocument
  };
};
