// Example: Using Sentry adapter
import { initialize, useAdapter, captureError, setUser, addBreadcrumb } from 'unified-error-handling';

// Initialize error handling
initialize({
  maxBreadcrumbs: 100,
  enableGlobalHandlers: true,
  beforeSend: (error) => {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Development error:', error);
      return null;
    }
    return error;
  }
});

// Configure Sentry adapter
// Note: @sentry/browser will be dynamically loaded when needed
await useAdapter('sentry', {
  dsn: 'https://your-key@sentry.io/your-project',
  environment: process.env.NODE_ENV,
  release: process.env.REACT_APP_VERSION,
  debug: false,
  integrations: [], // We handle integrations ourselves
  tracesSampleRate: 1.0,
  // Additional Sentry-specific options
  beforeSend: (event, hint) => {
    // Additional Sentry-specific filtering
    if (event.exception) {
      const error = hint.originalException;
      // Custom logic
    }
    return event;
  }
});

// Set user context
setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'johndoe',
  subscription: 'premium' // Custom attributes
});

// Add custom breadcrumbs
addBreadcrumb({
  message: 'User navigated to dashboard',
  category: 'navigation',
  level: 'info',
  data: {
    from: '/home',
    to: '/dashboard'
  }
});

// Example error handling in an async function
async function processPayment(paymentData) {
  addBreadcrumb({
    message: 'Payment processing started',
    category: 'payment',
    level: 'info',
    data: { amount: paymentData.amount }
  });

  try {
    const result = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    if (!result.ok) {
      throw new Error(`Payment failed: ${result.statusText}`);
    }
    
    addBreadcrumb({
      message: 'Payment processed successfully',
      category: 'payment',
      level: 'info'
    });
    
    return await result.json();
  } catch (error) {
    // This will send to Sentry with all context and breadcrumbs
    captureError(error, {
      tags: {
        feature: 'payment',
        payment_method: paymentData.method
      },
      extra: {
        amount: paymentData.amount,
        currency: paymentData.currency
      }
    });
    throw error;
  }
}