
/**
 * Utility to initialize Unblu Video Consulting
 * Documentation reference: https://www.unblu.com/en/doc/latest/
 */

const UNBLU_SERVER = "https://post-self-service.dev.unblu-test.com/app"; 
const UNBLU_API_KEY: string = "CECkwTtITwyICpnbrABAyg"; 

declare global {
  interface Window {
    unblu: any;
  }
}

// Singleton promise to track initialization status and prevent double-loading
let initPromise: Promise<void> | null = null;

export const triggerUnbluVideoCall = async (): Promise<void> => {
  if (!UNBLU_API_KEY || UNBLU_API_KEY === "YOUR_API_KEY_HERE") {
    console.error("Unblu API Key Missing");
    alert("Konfiguration unvollständig: Bitte Unblu API Key in 'utils/unbluIntegration.ts' eintragen.");
    return Promise.reject("Configuration missing");
  }

  // Case 1: Unblu is fully loaded and ready
  if (window.unblu && window.unblu.api) {
    console.log("Unblu already active. Toggling window...");
    try {
       // Depending on configuration, this opens the conversation UI or the start view
       window.unblu.api.toggleConversationWindow(true);
       return Promise.resolve();
    } catch (e) {
       console.error("Unblu API toggle error:", e);
       return Promise.reject(e);
    }
  }

  // Case 2: Initialization is already in progress
  if (initPromise) {
    console.log("Unblu initialization in progress, waiting...");
    return initPromise.then(() => {
        if (window.unblu?.api) {
            window.unblu.api.toggleConversationWindow(true);
        }
    });
  }

  // Case 3: Start initialization
  console.log("Starting Unblu initialization...");
  initPromise = new Promise((resolve, reject) => {
    const scriptUrl = `${UNBLU_SERVER}/unblu/visitor.js?x-unblu-apikey=${encodeURIComponent(UNBLU_API_KEY)}`;
    console.log("Loading Unblu script from:", scriptUrl);

    // Check if script is already in DOM to avoid duplicates
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
        console.log("Unblu script tag found, waiting for API...");
        waitForApi(resolve, reject);
        return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => {
      console.log("Unblu script loaded, polling for API...");
      waitForApi(resolve, reject);
    };
    
    script.onerror = (e) => {
      console.error("Failed to load Unblu script from URL:", scriptUrl);
      initPromise = null; // Reset promise so we can retry later
      
      // Remove failed script to allow clean retry
      try {
        if (document.head.contains(script)) {
            document.head.removeChild(script);
        }
      } catch (cleanupError) {
          console.warn("Could not remove failed script tag", cleanupError);
      }

      reject(new Error(`Failed to load Unblu script resource from ${scriptUrl}. Check network or API key.`));
    };

    document.head.appendChild(script);
  });

  return initPromise.then(() => {
      if (window.unblu?.api) {
         window.unblu.api.toggleConversationWindow(true);
      }
  });
};

/**
 * Polls for window.unblu.api availability
 */
function waitForApi(resolve: () => void, reject: (err: Error) => void) {
    let attempts = 0;
    const maxAttempts = 150; // 15 seconds max
    const interval = setInterval(() => {
        attempts++;
        if (window.unblu && window.unblu.api) {
            clearInterval(interval);
            console.log("Unblu API ready.");
            resolve();
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error("Unblu API timeout.");
            reject(new Error("Unblu API failed to initialize in time."));
        }
    }, 100);
}
