import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env vars regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  return {
    // 1. CRITICAL: Sets the base path for GitHub Pages deployment.
    base: '/DWM/', 

    // 2. PLUGINS: Enables React support and Tailwind CSS processing.
    plugins: [react(), tailwindcss()],

    // 3. DEFINE: Injects environment variables into your client-side code.
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    // 4. RESOLVE: Sets up the '@' alias to point to your /src folder.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 5. SERVER: Configures Hot Module Replacement (HMR).
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});