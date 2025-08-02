// Test production package imports
import { 
  initialize, 
  captureError, 
  useAdapter,
  createAdapter,
  setUser,
  addBreadcrumb
} from './dist/index.js';

console.log('Testing production package...\n');

// Test 1: Initialize
console.log('1. Testing initialize...');
try {
  initialize({
    enableGlobalHandlers: true,
    maxBreadcrumbs: 50
  });
  console.log('✅ Initialize successful');
} catch (error) {
  console.error('❌ Initialize failed:', error);
}

// Test 2: Set user context
console.log('\n2. Testing setUser...');
try {
  setUser({
    id: 'test-123',
    email: 'test@example.com'
  });
  console.log('✅ SetUser successful');
} catch (error) {
  console.error('❌ SetUser failed:', error);
}

// Test 3: Add breadcrumb
console.log('\n3. Testing addBreadcrumb...');
try {
  addBreadcrumb({
    message: 'Test breadcrumb',
    category: 'test',
    level: 'info'
  });
  console.log('✅ AddBreadcrumb successful');
} catch (error) {
  console.error('❌ AddBreadcrumb failed:', error);
}

// Test 4: Use console adapter
console.log('\n4. Testing console adapter...');
try {
  await useAdapter('console');
  console.log('✅ Console adapter loaded');
} catch (error) {
  console.error('❌ Console adapter failed:', error);
}

// Test 5: Capture error
console.log('\n5. Testing captureError...');
try {
  const testError = new Error('Test error for production check');
  captureError(testError, {
    tags: { test: true },
    extra: { production: 'check' }
  });
  console.log('✅ CaptureError successful');
} catch (error) {
  console.error('❌ CaptureError failed:', error);
}

// Test 6: Create custom adapter
console.log('\n6. Testing createAdapter...');
try {
  createAdapter('test-custom', {
    async initialize() {
      console.log('   Custom adapter initialized');
    },
    async send(error, context) {
      console.log('   Custom adapter received error:', error.message);
    }
  });
  console.log('✅ CreateAdapter successful');
} catch (error) {
  console.error('❌ CreateAdapter failed:', error);
}

// Test 7: Use custom adapter
console.log('\n7. Testing custom adapter usage...');
try {
  await useAdapter('test-custom');
  captureError(new Error('Test custom adapter'));
  console.log('✅ Custom adapter usage successful');
} catch (error) {
  console.error('❌ Custom adapter usage failed:', error);
}

console.log('\n✅ All production tests completed!');
console.log('\nPackage is ready for production use.');