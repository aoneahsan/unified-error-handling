// Basic usage example - Vanilla JavaScript
import { initialize, captureError, setUser, addBreadcrumb, useAdapter } from 'unified-error-handling';

// Initialize the error store
initialize({
  maxBreadcrumbs: 50,
  enableGlobalHandlers: true,
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  environment: 'production',
  beforeSend: (error) => {
    // Filter out certain errors
    if (error.message.includes('ResizeObserver')) {
      return null; // Don't send
    }
    return error;
  }
});

// Use the console adapter (built-in)
await useAdapter('console');

// Set user context
setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'john_doe'
});

// Add breadcrumbs
addBreadcrumb({
  message: 'User clicked checkout button',
  category: 'user-action',
  level: 'info',
  data: {
    productId: 'abc123',
    price: 29.99
  }
});

// Capture errors
try {
  // Your code that might throw
  throw new Error('Something went wrong!');
} catch (error) {
  captureError(error, {
    tags: {
      section: 'checkout',
      feature: 'payment'
    },
    extra: {
      cartItems: ['item1', 'item2']
    }
  });
}

// Or capture a message
captureMessage('User completed checkout', 'info');