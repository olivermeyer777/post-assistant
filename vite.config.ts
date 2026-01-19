
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Priority: System Env (Vercel) > .env file
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    build: {
      target: 'esnext',
    },
    define: {
      // This replaces 'process.env.API_KEY' in your code with the actual string value during build
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Polyfill for other process.env accesses to prevent crashes, but keep it empty
      'process.env': {}
    }
  };
});
