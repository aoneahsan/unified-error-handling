import { FirebaseConfig } from '@/types';

/**
 * Firebase Crashlytics specific types
 */
export interface FirebaseCrashlyticsOptions extends FirebaseConfig {
  /**
   * Firebase app configuration
   */
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };

  /**
   * Custom log limit
   */
  logLimit?: number;

  /**
   * Enable automatic data collection
   */
  automaticDataCollectionEnabled?: boolean;
}

/**
 * Firebase custom key types
 */
export enum FirebaseKeyType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  INT = 'int',
  LONG = 'long',
  FLOAT = 'float',
  DOUBLE = 'double',
}

/**
 * Firebase custom attribute
 */
export interface FirebaseCustomAttribute {
  key: string;
  value: string | boolean | number;
  type?: FirebaseKeyType;
}
