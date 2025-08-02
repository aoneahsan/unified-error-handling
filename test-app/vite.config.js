import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'unified-error-handling/react': '../src/react/index.ts',
      'unified-error-handling': '../src/index.ts'
    }
  }
});