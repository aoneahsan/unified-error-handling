import { registerPlugin } from '@capacitor/core';
import type { UnifiedErrorHandlingPlugin } from './definitions';

const UnifiedErrorHandling = registerPlugin<UnifiedErrorHandlingPlugin>('UnifiedErrorHandling', {
  web: () => import('./web').then(m => new m.UnifiedErrorHandlingWeb()),
});

export * from './definitions';
export * from './types';
export { UnifiedErrorHandling };