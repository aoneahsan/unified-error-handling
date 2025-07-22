#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  fix?: string;
}

class UnifiedErrorHandlingDoctor {
  private results: DiagnosticResult[] = [];

  async run() {
    console.log(chalk.bold('\n🩺 Unified Error Handling Doctor\n'));
    console.log('Running diagnostics...\n');

    // Run all checks
    await this.checkNodeVersion();
    await this.checkPackageInstallation();
    await this.checkCapacitorSetup();
    await this.checkProviderConfiguration();
    await this.checkPlatformSetup();
    await this.checkTypeScriptConfiguration();
    await this.checkBuildConfiguration();
    await this.checkRuntimeConfiguration();

    // Display results
    this.displayResults();
  }

  private async checkNodeVersion() {
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const major = parseInt(version.split('.')[0].substring(1));

      if (major >= 22) {
        this.addResult({
          name: 'Node.js Version',
          status: 'pass',
          message: `Node.js ${version} detected`,
        });
      } else {
        this.addResult({
          name: 'Node.js Version',
          status: 'warning',
          message: `Node.js ${version} detected. Recommended: v22.0.0 or higher`,
          fix: 'Consider upgrading Node.js to v22.0.0 or higher',
        });
      }
    } catch {
      this.addResult({
        name: 'Node.js Version',
        status: 'fail',
        message: 'Failed to detect Node.js version',
        fix: 'Ensure Node.js is installed and available in PATH',
      });
    }
  }

  private async checkPackageInstallation() {
    try {
      const packageJson = await fs.readFile('package.json', 'utf-8');
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['unified-error-handling']) {
        this.addResult({
          name: 'Package Installation',
          status: 'pass',
          message: 'unified-error-handling is installed',
        });
      } else {
        this.addResult({
          name: 'Package Installation',
          status: 'fail',
          message: 'unified-error-handling is not installed',
          fix: 'Run: npm install unified-error-handling',
        });
      }

      // Check for Capacitor
      if (deps['@capacitor/core']) {
        this.addResult({
          name: 'Capacitor Core',
          status: 'pass',
          message: '@capacitor/core is installed',
        });
      } else {
        this.addResult({
          name: 'Capacitor Core',
          status: 'fail',
          message: '@capacitor/core is not installed',
          fix: 'Run: npm install @capacitor/core',
        });
      }
    } catch {
      this.addResult({
        name: 'Package Installation',
        status: 'fail',
        message: 'Failed to read package.json',
        fix: 'Ensure you are in a valid npm project directory',
      });
    }
  }

  private async checkCapacitorSetup() {
    try {
      await fs.access('capacitor.config.json');
      const config = await fs.readFile('capacitor.config.json', 'utf-8');
      const capacitorConfig = JSON.parse(config);

      this.addResult({
        name: 'Capacitor Configuration',
        status: 'pass',
        message: `Capacitor configured for app: ${capacitorConfig.appId}`,
      });
    } catch {
      // capacitor.config.json not found - check for TypeScript config
      try {
        await fs.access('capacitor.config.ts');
        this.addResult({
          name: 'Capacitor Configuration',
          status: 'pass',
          message: 'Capacitor configuration found (TypeScript)',
        });
      } catch {
        // No Capacitor configuration found at all
        this.addResult({
          name: 'Capacitor Configuration',
          status: 'fail',
          message: 'No Capacitor configuration found',
          fix: 'Run: npx cap init',
        });
      }
    }
  }

  private async checkProviderConfiguration() {
    const configFiles = [
      'unified-error-handling.config.ts',
      'unified-error-handling.config.js',
    ];

    let configFound = false;
    for (const file of configFiles) {
      try {
        await fs.access(file);
        configFound = true;
        
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for provider configuration
        if (content.includes('providers:')) {
          this.addResult({
            name: 'Provider Configuration',
            status: 'pass',
            message: `Configuration found in ${file}`,
          });
        } else {
          this.addResult({
            name: 'Provider Configuration',
            status: 'warning',
            message: `Configuration file exists but no providers configured`,
            fix: 'Add provider configuration to your config file',
          });
        }
        break;
      } catch {
        // Config file not accessible - continue checking other files
      }
    }

    if (!configFound) {
      this.addResult({
        name: 'Provider Configuration',
        status: 'fail',
        message: 'No configuration file found',
        fix: 'Run: npx unified-error-handling init',
      });
    }
  }

  private async checkPlatformSetup() {
    // Check iOS
    try {
      await fs.access('ios');
      
      // Check for pod installation
      try {
        await fs.access('ios/Podfile.lock');
        this.addResult({
          name: 'iOS Platform',
          status: 'pass',
          message: 'iOS platform configured with pods installed',
        });
      } catch {
        // iOS Podfile.lock not found - pods not installed
        this.addResult({
          name: 'iOS Platform',
          status: 'warning',
          message: 'iOS platform exists but pods not installed',
          fix: 'Run: cd ios && pod install',
        });
      }
    } catch {
      // iOS directory not found - platform not added
      this.addResult({
        name: 'iOS Platform',
        status: 'warning',
        message: 'iOS platform not added',
        fix: 'Run: npx cap add ios (if targeting iOS)',
      });
    }

    // Check Android
    try {
      await fs.access('android');
      this.addResult({
        name: 'Android Platform',
        status: 'pass',
        message: 'Android platform configured',
      });
    } catch {
      // Android directory not found - platform not added
      this.addResult({
        name: 'Android Platform',
        status: 'warning',
        message: 'Android platform not added',
        fix: 'Run: npx cap add android (if targeting Android)',
      });
    }
  }

  private async checkTypeScriptConfiguration() {
    try {
      const tsConfig = await fs.readFile('tsconfig.json', 'utf-8');
      const config = JSON.parse(tsConfig);

      if (config.compilerOptions?.strict) {
        this.addResult({
          name: 'TypeScript Configuration',
          status: 'pass',
          message: 'TypeScript configured with strict mode',
        });
      } else {
        this.addResult({
          name: 'TypeScript Configuration',
          status: 'warning',
          message: 'TypeScript not using strict mode',
          fix: 'Consider enabling strict mode in tsconfig.json',
        });
      }
    } catch {
      // tsconfig.json not found - TypeScript not configured
      this.addResult({
        name: 'TypeScript Configuration',
        status: 'warning',
        message: 'No TypeScript configuration found',
        fix: 'If using TypeScript, create a tsconfig.json file',
      });
    }
  }

  private async checkBuildConfiguration() {
    try {
      const packageJson = await fs.readFile('package.json', 'utf-8');
      const pkg = JSON.parse(packageJson);

      if (pkg.scripts?.build) {
        this.addResult({
          name: 'Build Script',
          status: 'pass',
          message: 'Build script configured',
        });
      } else {
        this.addResult({
          name: 'Build Script',
          status: 'warning',
          message: 'No build script found',
          fix: 'Add a build script to package.json',
        });
      }
    } catch {
      // Already handled in checkPackageInstallation - empty catch is intentional
    }
  }

  private async checkRuntimeConfiguration() {
    // Check for common issues
    const checks = [
      {
        file: '.env',
        name: 'Environment Variables',
        message: 'Environment file found',
        warning: 'No .env file found - ensure API keys are configured',
      },
      {
        file: '.gitignore',
        name: 'Git Ignore',
        message: '.gitignore configured',
        warning: 'No .gitignore found - ensure sensitive files are excluded',
      },
    ];

    for (const check of checks) {
      try {
        await fs.access(check.file);
        this.addResult({
          name: check.name,
          status: 'pass',
          message: check.message,
        });
      } catch {
        // Check file not accessible - add warning
        this.addResult({
          name: check.name,
          status: 'warning',
          message: check.warning,
        });
      }
    }
  }

  private addResult(result: DiagnosticResult) {
    this.results.push(result);
  }

  private displayResults() {
    console.log('\n' + chalk.bold('Diagnostic Results:\n'));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      const color = result.status === 'pass' ? chalk.green : result.status === 'fail' ? chalk.red : chalk.yellow;
      
      console.log(`${icon} ${color(result.name)}`);
      console.log(`   ${result.message}`);
      
      if (result.fix) {
        console.log(chalk.dim(`   Fix: ${result.fix}`));
      }
      console.log();
    }

    console.log(chalk.bold('\nSummary:'));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warnings}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));

    if (failed > 0) {
      console.log(chalk.red('\n⚠️  Some checks failed. Please address the issues above.'));
      process.exit(1);
    } else if (warnings > 0) {
      console.log(chalk.yellow('\n⚠️  Some warnings detected. Consider addressing them for optimal setup.'));
    } else {
      console.log(chalk.green('\n✅ All checks passed! Your setup looks good.'));
    }
  }
}

// Run doctor
const doctor = new UnifiedErrorHandlingDoctor();
doctor.run().catch(console.error);