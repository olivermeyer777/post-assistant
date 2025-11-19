
/**
 * Utility to initialize Unblu Video Consulting
 * Documentation reference: https://www.unblu.com/en/doc/latest/
 */

// Placeholder for configuration - In a real app these would come from env vars
const UNBLU_SERVER = ""; // e.g. "https://unblu.cloud"
const UNBLU_API_KEY = ""; 

declare global {
  interface Window {
    unblu: any;
  }
}

export const triggerUnbluVideoCall = async (): Promise<void> => {
  if (!UNBLU_SERVER || !UNBLU_API_KEY) {
    console.warn("Unblu Configuration Missing. Please provide Server URL and API Key.");
    alert("Video Consulting Configuration Missing.\n\nPlease configure UNBLU_SERVER and UNBLU_API_KEY.");
    return;
  }

  // Check if Unblu is already loaded
  if (window.unblu && window.unblu.api) {
    try {
      // Assuming Unblu API is initialized, trigger a call
      // This specific call depends on the Unblu configuration (e.g. Named Area or Direct Call)
      // For now, we open the standard conversation modal
      await window.unblu.api.toggleConversationWindow(true);
      console.log("Unblu window opened");
    } catch (e) {
      console.error("Failed to trigger Unblu action", e);
    }
    return;
  }

  // Load Script dynamically if not present
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${UNBLU_SERVER}/unblu/visitor.js?x-unblu-apikey=${UNBLU_API_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Unblu Script Loaded");
      // Once loaded, the unblu object should be available on window
      // Depending on configuration, it might auto-start or need initialization
      resolve();
    };
    
    script.onerror = (e) => {
      console.error("Failed to load Unblu Script", e);
      alert("Could not connect to Video Consulting Service.");
      reject(e);
    };

    document.body.appendChild(script);
  });
};
