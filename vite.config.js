import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site lives under /<repository-name>/, set by the deploy workflow.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});
