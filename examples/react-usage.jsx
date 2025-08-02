// React usage example
import React, { useEffect } from 'react';
import { initialize, useAdapter } from 'unified-error-handling';
import { 
  ErrorBoundary, 
  useErrorHandler, 
  useErrorStore,
  useAsyncOperation,
  useErrorTracking 
} from 'unified-error-handling/react';

// Initialize once in your app entry point
initialize({
  maxBreadcrumbs: 100,
  enableGlobalHandlers: true,
  debug: process.env.NODE_ENV === 'development'
});

// App component
function App() {
  useEffect(() => {
    // Configure Sentry adapter
    useAdapter('sentry', {
      dsn: 'your-sentry-dsn',
      environment: process.env.NODE_ENV
    });
  }, []);

  return (
    <ErrorBoundary
      fallback={CustomErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error boundary caught:', error);
      }}
    >
      <MainApp />
    </ErrorBoundary>
  );
}

// Custom error fallback component
function CustomErrorFallback({ error, resetError }) {
  return (
    <div className="error-container">
      <h1>Oops! Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  );
}

// Example component using hooks
function UserProfile({ userId }) {
  const handleError = useErrorHandler();
  const { setUser, addBreadcrumb } = useErrorStore();
  
  // Track component lifecycle
  useErrorTracking('UserProfile');

  // Async operation with error handling
  const { data: user, loading, error, execute: loadUser } = useAsyncOperation(
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load user: ${response.statusText}`);
      }
      return response.json();
    },
    [userId]
  );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      // Set user context when user loads
      setUser({
        id: user.id,
        email: user.email,
        username: user.username
      });
    }
  }, [user, setUser]);

  const handleAction = () => {
    try {
      // Some action that might fail
      addBreadcrumb({
        message: 'User clicked action button',
        category: 'user-action',
        level: 'info'
      });
      
      // Simulate error
      throw new Error('Action failed!');
    } catch (error) {
      handleError(error, {
        tags: { component: 'UserProfile' },
        extra: { userId }
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading user: {error.message}</div>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <button onClick={handleAction}>Perform Action</button>
    </div>
  );
}

export default App;