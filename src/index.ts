// Core exports
export {
  errorStore,
  initialize,
  captureError,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
  clearBreadcrumbs,
  useAdapter,
  removeAdapter,
  flush,
  reset,
  subscribe,
  registerAdapter,
} from './store/error-store';

// Type exports
export type {
  ErrorStore,
  ErrorStoreState,
  ErrorStoreActions,
  ErrorStoreConfig,
  ErrorContext,
  UserContext,
  DeviceContext,
  Breadcrumb,
  NormalizedError,
  ErrorAdapter,
  ErrorListener,
  StorageAdapter,
  ErrorLevel,
} from './store/types';

// Adapter exports
export {
  createCustomAdapter,
  type CustomAdapterConfig,
} from './adapters/custom-adapter';

// Re-export adapter classes for advanced usage
export { SentryAdapter } from './adapters/sentry-adapter';
export { FirebaseAdapter } from './adapters/firebase-adapter';
export { CustomAdapter } from './adapters/custom-adapter';

// Utility function to create and register a custom adapter
import { createCustomAdapter, type CustomAdapterConfig as CAC } from './adapters/custom-adapter';
import { errorStore as store } from './store/error-store';
export function createAdapter(name: string, config: CAC): void {
  const adapter = createCustomAdapter(config);
  store.registerAdapter(name, adapter);
}