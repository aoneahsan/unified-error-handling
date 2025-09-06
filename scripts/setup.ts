#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { select, confirm } from '@inquirer/prompts';

const execAsync = promisify(exec);

interface SetupOptions {
  provider: string;
  projectPath: string;
  framework: 'react' | 'angular' | 'vue' | 'vanilla';
  typescript: boolean;
}

const PROVIDERS = [
  { name: 'Firebase Crashlytics', value: 'firebase' },
  { name: 'Sentry', value: 'sentry' },
  { name: 'DataDog', value: 'datadog' },
  { name: 'Bugsnag', value: 'bugsnag' },
  { name: 'Rollbar', value: 'rollbar' },
  { name: 'LogRocket', value: 'logrocket' },
  { name: 'Raygun', value: 'raygun' },
  { name: 'AppCenter', value: 'appcenter' },
];

async function setup() {
  console.log('\n🚀 Unified Error Handling Setup\n');

  try {
    // Select provider
    const provider = await select({
      message: 'Which error handling provider would you like to use?',
      choices: PROVIDERS,
    });

    // Detect framework
    const framework = await detectFramework();
    
    // Ask for TypeScript
    const typescript = await confirm({
      message: 'Are you using TypeScript?',
      default: true,
    });

    // Get project path
    const projectPath = process.cwd();

    const options: SetupOptions = {
      provider,
      projectPath,
      framework,
      typescript,
    };

    // Install dependencies
    await installDependencies(options);

    // Generate configuration
    await generateConfiguration(options);

    // Setup platform-specific files
    await setupPlatforms(options);

    // Create example files
    await createExamples(options);

    console.log('\n✅ Setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Review the generated configuration in unified-error-handling.config.js');
    console.log('2. Add your provider API keys/credentials');
    console.log('3. Import and initialize the plugin in your app');
    console.log('\nFor more information, visit: https://github.com/aoneahsan/unified-error-handling\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

async function detectFramework(): Promise<'react' | 'angular' | 'vue' | 'vanilla'> {
  try {
    const packageJson = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.react) return 'react';
    if (deps['@angular/core']) return 'angular';
    if (deps.vue) return 'vue';
    
    return 'vanilla';
  } catch {
    // No package.json or error reading - default to vanilla
    return 'vanilla';
  }
}

async function installDependencies(options: SetupOptions) {
  console.log('\n📦 Installing dependencies...\n');

  const deps = ['unified-error-handling'];
  
  // Add provider-specific dependencies
  switch (options.provider) {
    case 'firebase':
      deps.push('capacitor-firebase-kit');
      break;
    case 'sentry':
      deps.push('@sentry/browser');
      if (options.framework === 'react') {
        deps.push('@sentry/react');
      }
      break;
    case 'datadog':
      deps.push('@datadog/browser-logs', '@datadog/browser-rum');
      break;
    case 'bugsnag':
      deps.push('@bugsnag/js', '@bugsnag/plugin-react');
      break;
    case 'rollbar':
      deps.push('rollbar');
      break;
    case 'logrocket':
      deps.push('logrocket', 'logrocket-react');
      break;
    case 'raygun':
      deps.push('raygun4js');
      break;
    case 'appcenter':
      deps.push('appcenter', 'appcenter-crashes');
      break;
  }

  const packageManager = await detectPackageManager();
  const installCmd = getInstallCommand(packageManager, deps);
  
  console.log(`Running: ${installCmd}`);
  await execAsync(installCmd);
}

async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
  try {
    await fs.access('yarn.lock');
    return 'yarn';
  } catch {
    // yarn.lock not found - continue checking
  }
  
  try {
    await fs.access('pnpm-lock.yaml');
    return 'pnpm';
  } catch {
    // pnpm-lock.yaml not found - continue checking
  }
  
  return 'npm';
}

function getInstallCommand(pm: 'npm' | 'yarn' | 'pnpm', deps: string[]): string {
  const depsStr = deps.join(' ');
  
  switch (pm) {
    case 'yarn':
      return `yarn add ${depsStr}`;
    case 'pnpm':
      return `pnpm add ${depsStr}`;
    default:
      return `npm install ${depsStr}`;
  }
}

async function generateConfiguration(options: SetupOptions) {
  console.log('\n⚙️  Generating configuration...\n');

  const config = `import { UnifiedErrorHandling } from 'unified-error-handling';

// Unified Error Handling Configuration
export const errorHandlingConfig = {
  providers: [{
    type: '${options.provider}',
    config: {
      // Add your ${options.provider} configuration here
      ${getProviderConfigTemplate(options.provider)}
    }
  }],
  
  // Global configuration
  enableInDevelopment: true,
  enableOfflineQueue: true,
  maxBreadcrumbs: 100,
  
  // Error filtering
  beforeSend: (error) => {
    // Modify or filter errors before sending
    return error;
  },
  
  // Performance monitoring
  enablePerformanceMonitoring: true,
};

// Initialize error handling
export async function initializeErrorHandling() {
  try {
    await UnifiedErrorHandling.initialize(errorHandlingConfig);
    console.log('Error handling initialized successfully');
  } catch (error) {
    console.error('Failed to initialize error handling:', error);
  }
}
`;

  const fileName = options.typescript 
    ? 'unified-error-handling.config.ts'
    : 'unified-error-handling.config.js';
    
  await fs.writeFile(fileName, config);
  console.log(`Created ${fileName}`);
}

function getProviderConfigTemplate(provider: string): string {
  switch (provider) {
    case 'firebase':
      return `// Firebase configuration is auto-detected from capacitor-firebase-kit
      crashlyticsCollectionEnabled: true,
      enableInDevelopment: false,`;
    case 'sentry':
      return `dsn: 'YOUR_SENTRY_DSN',
      environment: 'production',
      tracesSampleRate: 1.0,`;
    case 'datadog':
      return `clientToken: 'YOUR_DATADOG_CLIENT_TOKEN',
      applicationId: 'YOUR_APPLICATION_ID',
      site: 'datadoghq.com',
      service: 'your-app-name',`;
    case 'bugsnag':
      return `apiKey: 'YOUR_BUGSNAG_API_KEY',
      releaseStage: 'production',
      enabledReleaseStages: ['production', 'staging'],`;
    case 'rollbar':
      return `accessToken: 'YOUR_ROLLBAR_ACCESS_TOKEN',
      environment: 'production',
      captureUncaught: true,`;
    case 'logrocket':
      return `appID: 'YOUR_LOGROCKET_APP_ID',`;
    case 'raygun':
      return `apiKey: 'YOUR_RAYGUN_API_KEY',
      version: '1.0.0',`;
    case 'appcenter':
      return `appSecret: 'YOUR_APPCENTER_APP_SECRET',`;
    default:
      return '';
  }
}

async function setupPlatforms(_options: SetupOptions) {
  console.log('\n📱 Setting up platforms...\n');

  // Check for iOS
  try {
    await fs.access('ios');
    console.log('iOS platform detected - remember to run: cd ios && pod install');
  } catch {
    // iOS platform not found - continue
  }

  // Check for Android
  try {
    await fs.access('android');
    console.log('Android platform detected - no additional setup required');
  } catch {
    // Android platform not found - continue
  }
}

async function createExamples(options: SetupOptions) {
  console.log('\n📝 Creating example files...\n');

  if (options.framework === 'react') {
    const example = `import React from 'react';
import { ReactErrorProvider, ErrorBoundary, useErrorHandler } from 'unified-error-handling';
import { initializeErrorHandling } from './unified-error-handling.config';

// Initialize error handling
initializeErrorHandling();

// Wrap your app with error handling
export function App() {
  return (
    <ReactErrorProvider>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <YourApp />
      </ErrorBoundary>
    </ReactErrorProvider>
  );
}

// Example component using error handling
function ExampleComponent() {
  const { logError, addBreadcrumb } = useErrorHandler();

  const handleClick = async () => {
    try {
      addBreadcrumb({
        message: 'User clicked button',
        category: 'user-action',
        level: 'info'
      });
      
      await riskyOperation();
    } catch (error) {
      logError(error, {
        level: 'error',
        context: { component: 'ExampleComponent' }
      });
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}

function ErrorFallback() {
  return <div>Something went wrong. Please try again.</div>;
}
`;

    const fileName = options.typescript 
      ? 'error-handling.example.tsx'
      : 'error-handling.example.jsx';
      
    await fs.writeFile(fileName, example);
    console.log(`Created ${fileName}`);
  }
}

// Run setup
setup().catch(console.error);