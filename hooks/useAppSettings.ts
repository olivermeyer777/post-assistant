
import { useState, useEffect } from 'react';
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
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Helper to ignore specific "not found" errors which are expected in a fresh setup
      // PGRST116: JSON object requested, multiple (or no) rows returned (common for .single() on empty table)
      // 42P01: Relation does not exist (Table missing)
      const isCriticalError = (error: any) => {
          if (!error) return false;
          const ignoredCodes = ['PGRST116', '42P01'];
          return !ignoredCodes.includes(error.code);
      };

      // 1. Fetch Global Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .single();
        
      if (isCriticalError(settingsError)) {
          console.warn(`Supabase: Failed to load settings. Using defaults. Code: ${settingsError?.code}, Msg: ${settingsError?.message}`);
      }

      // 2. Fetch Processes
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('*');

      if (isCriticalError(processError)) {
           console.warn(`Supabase: Failed to load processes. Using defaults. Code: ${processError?.code}, Msg: ${processError?.message}`);
      }

      // 3. Fetch All Documents
      const { data: docData, error: docError } = await supabase
        .from('knowledge_documents')
        .select('*');

      if (isCriticalError(docError)) {
           console.warn(`Supabase: Failed to load documents. Using defaults. Code: ${docError?.code}, Msg: ${docError?.message}`);
      }

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

    } catch (error) {
      console.warn("Supabase Fetch Exception (using defaults):", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
             const { error } = await supabase.from('app_settings').update({ [dbKeyMap[key]]: value }).gt('id', 0);
             if (error) console.warn("Update assistant settings warning:", error.message);
          } catch (e) { console.warn("Update assistant settings failed", e); }
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
             const { error } = await supabase.from('processes').update(dbUpdates).eq('process_key', key);
             if (error) console.warn("Update process config warning:", error.message);
          } catch (e) { console.warn("Update process config failed", e); }
      }
  };

  // --- DOCUMENT FUNCTIONS ---

  const addGlobalDocument = async (doc: KnowledgeDocument) => {
      try {
        // DB Insert
        const { data, error } = await supabase.from('knowledge_documents').insert({
            title: doc.title,
            content: doc.content,
            scope: 'global',
            is_active: true
        }).select().single();

        if (error) {
            console.warn("Add global document warning:", error.message);
            throw error;
        }

        if (data) {
            // Update State with real ID from DB
            setSettings(prev => ({
                ...prev,
                globalDocuments: [...prev.globalDocuments, { ...doc, id: data.id }]
            }));
        }
      } catch (e) {
          // Fallback optimistic for demo
          setSettings(prev => ({
              ...prev,
              globalDocuments: [...prev.globalDocuments, doc]
          }));
      }
  };

  const removeGlobalDocument = async (id: string) => {
      setSettings(prev => ({
          ...prev,
          globalDocuments: prev.globalDocuments.filter(d => d.id !== id)
      }));
      try {
        await supabase.from('knowledge_documents').delete().eq('id', id);
      } catch (e) { console.warn("Delete document failed", e); }
  };

  const addProcessDocument = async (processKey: string, doc: KnowledgeDocument) => {
      try {
        const { data, error } = await supabase.from('knowledge_documents').insert({
            title: doc.title,
            content: doc.content,
            scope: 'process',
            process_key: processKey,
            is_active: true
        }).select().single();

        if (error) {
            console.warn("Add process document warning:", error.message);
            throw error;
        }

        if (data) {
            setSettings(prev => {
                const proc = prev.processes[processKey];
                if (!proc) return prev;
                return {
                    ...prev,
                    processes: {
                        ...prev.processes,
                        [processKey]: { ...proc, documents: [...proc.documents, { ...doc, id: data.id }] }
                    }
                };
            });
        }
      } catch (e) {
          // Fallback optimistic
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
      }
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
      } catch (e) { console.warn("Delete process doc failed", e); }
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
