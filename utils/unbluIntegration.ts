
/**
 * Utility to initialize Unblu Video Consulting
 * The scripts are loaded statically in index.html
 */

declare global {
  interface Window {
    unblu: any;
  }
}

// Helper to wait for the API to become available
// Increased timeout to 30s to allow for slower networks and prevent premature timeout errors
const waitForUnbluApi = (timeoutMs: number = 30000): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Function to check availability
        const check = () => {
             try {
                if (window.unblu && window.unblu.api) {
                    // If the API exposes an isInitialized check, use it (v5+ specific, but good safety)
                    if (typeof window.unblu.api.isInitialized === 'function') {
                        return window.unblu.api.isInitialized() ? window.unblu.api : null;
                    }
                    return window.unblu.api;
                }
             } catch (e) {
                 // Ignore access errors during init
             }
            return null;
        };

        // Check immediately
        const api = check();
        if (api) {
            resolve(api);
            return;
        }

        const startTime = Date.now();
        const intervalId = setInterval(() => {
            const api = check();
            if (api) {
                clearInterval(intervalId);
                resolve(api);
            } else if (Date.now() - startTime > timeoutMs) {
                clearInterval(intervalId);
                // Return a simple string error, not a complex object
                reject(new Error("Video service initialization timed out. Please check your connection."));
            }
        }, 500);
    });
};

export const triggerUnbluVideoCall = async (): Promise<void> => {
  try {
      // 1. Wait for API to be ready (polls window.unblu.api)
      const api = await waitForUnbluApi();

      // 2. Interact with API
      // Wrap specific Unblu calls in their own try-catch to sanitize the complex error objects immediately
      try {
          // Check for existing conversation first
          const conversation = await api.getActiveConversation();
          
          if (!conversation) {
              console.log("No active conversation, starting new one...");
              // This call can throw INITIALIZATION_TIMEOUT if the backend isn't ready yet
              await api.startConversation("VIDEO_REQUEST");
              console.log("Conversation started.");
          } else {
              console.log("Active conversation detected, opening UI.");
          }

          // 3. Open UI
          if (api.ui && api.ui.openIndividualUi) {
              api.ui.openIndividualUi();
          }

      } catch (innerError: any) {
          // CRITICAL: Convert complex/circular error objects to simple strings immediately.
          // The error "Converting circular structure to JSON" happens because the Unblu error object is circular.
          // We must NOT log 'innerError' directly or pass it to any function that might stringify it.
          
          let safeMsg = "Video call failed.";
          
          try {
            if (innerError) {
                // Handle specific Unblu error types safely
                if (innerError.type === 'INITIALIZATION_TIMEOUT' || 
                    (innerError.detail && typeof innerError.detail === 'string' && innerError.detail.includes('Timeout'))) {
                    safeMsg = "Video service is warming up. Please try again in a few seconds.";
                } 
                else if (typeof innerError.message === 'string') {
                    safeMsg = innerError.message;
                }
                else if (typeof innerError === 'string') {
                    safeMsg = innerError;
                }
            }
          } catch (e) {
              // Fallback if property access fails
              safeMsg = "Unknown video service error.";
          }
          
          // Throw a clean Error object with ONLY a string message
          throw new Error(safeMsg);
      }

  } catch (e: any) {
      // This catch block guarantees that 'e' is either the timeout Error from waitForUnbluApi 
      // or the clean Error from the inner catch block.
      
      const logMsg = e instanceof Error ? e.message : String(e);
      // Ensure we only log strings
      console.error(`Unblu integration error: ${logMsg}`);
      
      throw new Error(logMsg);
  }
};