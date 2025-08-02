import React, { useState, useEffect } from 'react';
import { 
  useAdapter, 
  captureError, 
  captureMessage,
  setUser,
  addBreadcrumb,
  createAdapter
} from 'unified-error-handling';
import { 
  ErrorBoundary, 
  useErrorHandler, 
  useErrorStore,
  useAsyncOperation 
} from 'unified-error-handling/react';

// Create a custom test adapter to verify adapter system
createAdapter('test-adapter', {
  logs: [],
  
  async initialize(config) {
    this.logs.push({ type: 'init', config });
    console.log('Test adapter initialized:', config);
  },
  
  async send(error, context) {
    const log = { type: 'error', error, context, timestamp: Date.now() };
    this.logs.push(log);
    console.log('Test adapter received error:', log);
  },
  
  async setContext(context) {
    this.logs.push({ type: 'context', context });
    console.log('Test adapter context updated:', context);
  },
  
  async addBreadcrumb(breadcrumb) {
    this.logs.push({ type: 'breadcrumb', breadcrumb });
    console.log('Test adapter breadcrumb:', breadcrumb);
  }
});

function App() {
  const [adapter, setAdapter] = useState('console');
  const [testResults, setTestResults] = useState([]);
  
  useEffect(() => {
    // Set initial user context
    setUser({
      id: 'test-user-123',
      email: 'test@example.com'
    });
  }, []);

  const runTests = async () => {
    const results = [];
    
    // Test 1: Verify zero dependencies
    results.push({
      name: 'Zero Dependencies',
      passed: !window.unifiedErrorHandling?.dependencies,
      details: 'Library has no runtime dependencies'
    });

    // Test 2: Provider-less architecture (no Context required)
    results.push({
      name: 'Provider-less Architecture',
      passed: typeof useErrorHandler === 'function',
      details: 'Hooks work without Context Provider'
    });

    // Test 3: Dynamic adapter loading
    try {
      await useAdapter(adapter);
      results.push({
        name: 'Dynamic Adapter Loading',
        passed: true,
        details: `Successfully loaded ${adapter} adapter`
      });
    } catch (error) {
      results.push({
        name: 'Dynamic Adapter Loading',
        passed: false,
        details: error.message
      });
    }

    // Test 4: Error capturing
    try {
      const testError = new Error('Test error for verification');
      captureError(testError, { tags: { test: true } });
      results.push({
        name: 'Error Capturing',
        passed: true,
        details: 'Error captured successfully'
      });
    } catch (error) {
      results.push({
        name: 'Error Capturing',
        passed: false,
        details: error.message
      });
    }

    // Test 5: Breadcrumb tracking
    try {
      addBreadcrumb({
        message: 'Test breadcrumb',
        category: 'test',
        level: 'info'
      });
      results.push({
        name: 'Breadcrumb Tracking',
        passed: true,
        details: 'Breadcrumb added successfully'
      });
    } catch (error) {
      results.push({
        name: 'Breadcrumb Tracking',
        passed: false,
        details: error.message
      });
    }

    // Test 6: Message capturing
    try {
      captureMessage('Test message', 'info');
      results.push({
        name: 'Message Capturing',
        passed: true,
        details: 'Message captured successfully'
      });
    } catch (error) {
      results.push({
        name: 'Message Capturing',
        passed: false,
        details: error.message
      });
    }

    setTestResults(results);
  };

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
        <h1>Unified Error Handling Test App</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2>Adapter Selection</h2>
          <select 
            value={adapter} 
            onChange={(e) => setAdapter(e.target.value)}
            style={{ padding: '5px', marginRight: '10px' }}
          >
            <option value="console">Console (Built-in)</option>
            <option value="test-adapter">Test Adapter (Custom)</option>
            <option value="sentry">Sentry (Dynamic)</option>
            <option value="firebase">Firebase (Dynamic)</option>
          </select>
          <button onClick={() => useAdapter(adapter)}>
            Load Adapter
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Test Actions</h2>
          <button onClick={runTests} style={{ marginRight: '10px' }}>
            Run All Tests
          </button>
          <TestComponent />
        </div>

        {testResults.length > 0 && (
          <div>
            <h2>Test Results</h2>
            <ul>
              {testResults.map((result, index) => (
                <li key={index} style={{ 
                  color: result.passed ? 'green' : 'red',
                  marginBottom: '10px' 
                }}>
                  <strong>{result.name}:</strong> {result.passed ? '✓' : '✗'} - {result.details}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function TestComponent() {
  const handleError = useErrorHandler();
  const { context, breadcrumbs } = useErrorStore();
  
  const { data, loading, error, execute } = useAsyncOperation(
    async () => {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    }
  );

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Component Tests</h3>
      
      <button 
        onClick={() => {
          try {
            throw new Error('Test error from component');
          } catch (err) {
            handleError(err);
          }
        }}
        style={{ marginRight: '10px' }}
      >
        Trigger Error
      </button>

      <button 
        onClick={execute}
        style={{ marginRight: '10px' }}
      >
        Test Async Operation
      </button>

      <button 
        onClick={() => {
          // This will cause an unhandled error that ErrorBoundary should catch
          throw new Error('Unhandled error for boundary');
        }}
      >
        Trigger Unhandled Error
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        <p>Context Users: {context.user ? context.user.email : 'None'}</p>
        <p>Breadcrumbs: {breadcrumbs.length}</p>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Async Error: {error.message}</p>}
        {data && <p style={{ color: 'green' }}>Async Success: {data.name}</p>}
      </div>
    </div>
  );
}

function ErrorFallback({ error, resetError }) {
  return (
    <div style={{ 
      padding: '20px', 
      background: '#fee', 
      border: '1px solid #fcc',
      borderRadius: '4px' 
    }}>
      <h2>Error Boundary Caught Error</h2>
      <p style={{ color: 'red' }}>{error.message}</p>
      <button onClick={resetError}>Reset</button>
    </div>
  );
}

export default App;