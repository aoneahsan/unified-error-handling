// Example: Creating a custom adapter
import { createAdapter, initialize, useAdapter, captureError } from 'unified-error-handling';

// Create a custom adapter that sends errors to your own backend
createAdapter('my-backend', {
  async initialize() {
    console.log('My backend adapter initialized');
  },
  
  async send(error, context) {
    // Send error to your backend
    const response = await fetch('https://api.myapp.com/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key'
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        type: error.type,
        level: error.level,
        timestamp: error.timestamp,
        user: context.user,
        device: context.device,
        tags: context.tags,
        extra: context.extra,
        breadcrumbs: error.breadcrumbs,
        fingerprint: error.fingerprint
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send error: ${response.statusText}`);
    }
  },

  async setContext(context) {
    // Optional: Update context on your backend
    console.log('Context updated:', context);
  },

  async addBreadcrumb(breadcrumb) {
    // Optional: Send breadcrumb immediately
    console.log('Breadcrumb added:', breadcrumb);
  },

  async flush() {
    // Optional: Flush any pending errors
    console.log('Flushing errors...');
  },

  async close() {
    // Optional: Cleanup
    console.log('Closing adapter...');
  }
});

// Initialize and use the custom adapter
initialize({
  enableGlobalHandlers: true
});

await useAdapter('my-backend');

// Now errors will be sent to your backend
try {
  throw new Error('Test error');
} catch (error) {
  captureError(error);
}