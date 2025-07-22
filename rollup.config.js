import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorUnifiedErrorHandling',
      globals: {
        '@capacitor/core': 'capacitorExports',
        react: 'React',
        'react/jsx-runtime': 'ReactJSXRuntime',
        localforage: 'localforage',
      },
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  external: [
    '@capacitor/core',
    'react',
    'react/jsx-runtime',
    'localforage',
    // External all provider SDKs to avoid bundling issues
    '@sentry/browser',
    '@sentry/integrations',
    '@datadog/browser-logs',
    '@datadog/browser-rum',
    '@bugsnag/js',
    'rollbar',
    'logrocket',
    'raygun4js',
    'appcenter',
    'capacitor-firebase-kit',
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    nodePolyfills(),
  ],
};
