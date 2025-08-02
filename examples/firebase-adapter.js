// Example: Using Firebase Crashlytics adapter
import { initialize, useAdapter, captureError, setUser } from 'unified-error-handling';

// Initialize error handling
initialize({
  enableGlobalHandlers: true,
  enableConsoleCapture: false, // Firebase has its own console capture
  environment: 'production'
});

// Configure Firebase adapter
// Note: Firebase SDK will be dynamically loaded when needed
await useAdapter('firebase', {
  firebaseConfig: {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  },
  enableAnalytics: true // Optional: also log to Firebase Analytics
});

// Set user context
setUser({
  id: 'user123',
  email: 'user@example.com'
});

// Example: Capture errors in your app
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    // Error will be automatically sent to Firebase Crashlytics
    captureError(error, {
      tags: {
        feature: 'user-fetch',
        endpoint: 'users'
      },
      extra: {
        userId,
        timestamp: new Date().toISOString()
      }
    });
    throw error; // Re-throw if you want calling code to handle it
  }
}