import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'unified-error-handling/react': '../src/react/index.ts',
      'unified-error-handling': '../src/index.ts'
    },
    // The library marks react/react-dom as optional peer deps; when its source
    // is aliased in directly, Vite 8 (Rolldown) would otherwise stub them via
    // `__vite-optional-peer-dep:react`. Dedupe forces resolution to this
    // app's real react copy so the library's named hook imports resolve.
    dedupe: ['react', 'react-dom']
  },
  logLevel: 'info',
});