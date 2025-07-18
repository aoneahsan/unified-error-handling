import { registerPlugin } from '@capacitor/core';
import type { UnifiedErrorHandlingPlugin } from '../definitions';

/**
 * Error handler service - separate from main index to avoid circular dependencies
 */
export const ErrorHandlerService = registerPlugin<UnifiedErrorHandlingPlugin>('UnifiedErrorHandling', {
  web: () => import('../web').then((m) => new m.UnifiedErrorHandlingWeb()),
});