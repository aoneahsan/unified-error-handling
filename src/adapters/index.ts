export { BaseAdapter } from './base-adapter';
export { SentryAdapter } from './sentry-adapter';
export { FirebaseAdapter } from './firebase-adapter';
export { CustomAdapter, createCustomAdapter } from './custom-adapter';
export type { CustomAdapterConfig } from './custom-adapter';

// Adapter loader for the store
export async function loadAdapter(name: string): Promise<any> {
  switch (name) {
    case 'sentry':
      const { SentryAdapter } = await import('./sentry-adapter');
      return new SentryAdapter();
    
    case 'firebase':
      const { FirebaseAdapter } = await import('./firebase-adapter');
      return new FirebaseAdapter();
    
    default:
      return null;
  }
}