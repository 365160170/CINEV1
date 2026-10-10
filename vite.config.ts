import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// En GitHub Pages el sitio vive en /<repo>/. El workflow define BASE_PATH.
export default defineConfig({ plugins: [react()], base: process.env.BASE_PATH || '/' });
