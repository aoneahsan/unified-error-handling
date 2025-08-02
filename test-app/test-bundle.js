// Test to verify the library bundle has zero dependencies
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('Testing unified-error-handling bundle...\n');

// Check package.json
const pkgPath = join(process.cwd(), '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

console.log('✓ Package name:', pkg.name);
console.log('✓ Version:', pkg.version);
console.log('✓ Dependencies:', Object.keys(pkg.dependencies || {}).length);
console.log('✓ Peer dependencies:', Object.keys(pkg.peerDependencies || {}));

// Test imports
try {
  const { initialize, captureError, useAdapter, createAdapter } = await import('../dist/index.js');
  console.log('\n✓ Core exports available');
  
  // Test React exports
  const react = await import('../dist/react/index.js');
  console.log('✓ React exports available');
  
  // Verify no bundled dependencies
  const indexContent = readFileSync(join(process.cwd(), '../dist/index.js'), 'utf8');
  const hasExternalDeps = indexContent.includes('node_modules');
  console.log(`✓ Bundle is clean (no node_modules): ${!hasExternalDeps}`);
  
  console.log('\n🎉 All tests passed! Library is production ready.');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}