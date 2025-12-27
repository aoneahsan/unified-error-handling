export { BaseAdapter } from './base-adapter';
export { SentryAdapter } from './sentry-adapter';
export { FirebaseAdapter } from './firebase-adapter';
export { DataDogAdapter } from './datadog-adapter';
export { BugsnagAdapter } from './bugsnag-adapter';
export { RollbarAdapter } from './rollbar-adapter';
export { LogRocketAdapter } from './logrocket-adapter';
export { RaygunAdapter } from './raygun-adapter';
export { AppCenterAdapter } from './appcenter-adapter';
export { CustomAdapter, createCustomAdapter } from './custom-adapter';
export type { CustomAdapterConfig } from './custom-adapter';

// Adapter loader for the store
export async function loadAdapter(name: string): Promise<any> {
  switch (name) {
    case 'sentry': {
      const { SentryAdapter } = await import('./sentry-adapter');
      return new SentryAdapter();
    }

    case 'firebase': {
      const { FirebaseAdapter } = await import('./firebase-adapter');
      return new FirebaseAdapter();
    }

    case 'datadog': {
      const { DataDogAdapter } = await import('./datadog-adapter');
      return new DataDogAdapter();
    }

    case 'bugsnag': {
      const { BugsnagAdapter } = await import('./bugsnag-adapter');
      return new BugsnagAdapter();
    }

    case 'rollbar': {
      const { RollbarAdapter } = await import('./rollbar-adapter');
      return new RollbarAdapter();
    }

    case 'logrocket': {
      const { LogRocketAdapter } = await import('./logrocket-adapter');
      return new LogRocketAdapter();
    }

    case 'raygun': {
      const { RaygunAdapter } = await import('./raygun-adapter');
      return new RaygunAdapter();
    }

    case 'appcenter': {
      const { AppCenterAdapter } = await import('./appcenter-adapter');
      return new AppCenterAdapter();
    }

    default:
      return null;
  }
}
