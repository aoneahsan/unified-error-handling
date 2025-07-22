#!/usr/bin/env node

import * as fs from 'fs/promises';
import { glob } from 'glob';
import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

interface MigrationPattern {
  from: RegExp;
  to: string;
  description: string;
}

interface ProviderMigration {
  name: string;
  patterns: MigrationPattern[];
  imports: {
    from: string[];
    to: string;
  };
}

const PROVIDER_MIGRATIONS: ProviderMigration[] = [
  {
    name: 'Firebase Crashlytics',
    imports: {
      from: ['@react-native-firebase/crashlytics', 'firebase/crashlytics'],
      to: 'unified-error-handling',
    },
    patterns: [
      {
        from: /crashlytics\(\)\.recordError\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logError($1)',
        description: 'Record error calls',
      },
      {
        from: /crashlytics\(\)\.log\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logMessage($1)',
        description: 'Log message calls',
      },
      {
        from: /crashlytics\(\)\.setUserId\((.*?)\)/g,
        to: 'UnifiedErrorHandling.setUserContext({ id: $1 })',
        description: 'Set user ID calls',
      },
      {
        from: /crashlytics\(\)\.setAttribute\((.*?),\s*(.*?)\)/g,
        to: 'UnifiedErrorHandling.setTag($1, $2)',
        description: 'Set attribute calls',
      },
    ],
  },
  {
    name: 'Sentry',
    imports: {
      from: ['@sentry/react', '@sentry/browser', '@sentry/react-native'],
      to: 'unified-error-handling',
    },
    patterns: [
      {
        from: /Sentry\.captureException\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logError($1)',
        description: 'Capture exception calls',
      },
      {
        from: /Sentry\.captureMessage\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logMessage($1)',
        description: 'Capture message calls',
      },
      {
        from: /Sentry\.setUser\((.*?)\)/g,
        to: 'UnifiedErrorHandling.setUserContext($1)',
        description: 'Set user calls',
      },
      {
        from: /Sentry\.addBreadcrumb\((.*?)\)/g,
        to: 'UnifiedErrorHandling.addBreadcrumb($1)',
        description: 'Add breadcrumb calls',
      },
      {
        from: /Sentry\.setTag\((.*?),\s*(.*?)\)/g,
        to: 'UnifiedErrorHandling.setTag($1, $2)',
        description: 'Set tag calls',
      },
    ],
  },
  {
    name: 'Bugsnag',
    imports: {
      from: ['@bugsnag/js', '@bugsnag/react', '@bugsnag/react-native'],
      to: 'unified-error-handling',
    },
    patterns: [
      {
        from: /Bugsnag\.notify\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logError($1)',
        description: 'Notify error calls',
      },
      {
        from: /Bugsnag\.leaveBreadcrumb\((.*?)\)/g,
        to: 'UnifiedErrorHandling.addBreadcrumb({ message: $1 })',
        description: 'Leave breadcrumb calls',
      },
      {
        from: /Bugsnag\.setUser\((.*?)\)/g,
        to: 'UnifiedErrorHandling.setUserContext($1)',
        description: 'Set user calls',
      },
    ],
  },
  {
    name: 'Rollbar',
    imports: {
      from: ['rollbar'],
      to: 'unified-error-handling',
    },
    patterns: [
      {
        from: /Rollbar\.error\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logError($1)',
        description: 'Error logging calls',
      },
      {
        from: /Rollbar\.info\((.*?)\)/g,
        to: 'UnifiedErrorHandling.logMessage($1, "info")',
        description: 'Info logging calls',
      },
      {
        from: /Rollbar\.configure\({person:\s*(.*?)}\)/g,
        to: 'UnifiedErrorHandling.setUserContext($1)',
        description: 'Configure person calls',
      },
    ],
  },
];

class MigrationTool {
  private selectedProvider?: ProviderMigration;
  private filesToMigrate: string[] = [];
  private changes: Map<string, string[]> = new Map();

  async run() {
    console.log(chalk.bold('\n🔄 Unified Error Handling Migration Tool\n'));

    try {
      // Select provider to migrate from
      await this.selectProvider();

      // Find files to migrate
      await this.findFiles();

      // Analyze changes
      await this.analyzeChanges();

      // Show preview
      await this.showPreview();

      // Confirm and apply
      await this.applyChanges();

      console.log(chalk.green('\n✅ Migration completed successfully!\n'));
      console.log('Next steps:');
      console.log('1. Review the migrated code');
      console.log('2. Run your tests to ensure everything works');
      console.log('3. Remove old provider dependencies when ready');

    } catch (error) {
      console.error(chalk.red('\n❌ Migration failed:'), error);
      process.exit(1);
    }
  }

  private async selectProvider() {
    const provider = await select({
      message: 'Which error handling provider are you migrating from?',
      choices: PROVIDER_MIGRATIONS.map(p => ({
        name: p.name,
        value: p,
      })),
    });

    this.selectedProvider = provider;
  }

  private async findFiles() {
    console.log('\n📁 Searching for files...\n');

    const patterns = [
      '**/*.{js,jsx,ts,tsx}',
      '!node_modules/**',
      '!dist/**',
      '!build/**',
      '!coverage/**',
    ];

    const files = await glob(patterns[0], {
      ignore: patterns.slice(1).map(p => p.substring(1)),
    });

    // Filter files that contain provider imports
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const hasProviderImport = this.selectedProvider!.imports.from.some(imp =>
        content.includes(imp)
      );

      if (hasProviderImport) {
        this.filesToMigrate.push(file);
      }
    }

    console.log(`Found ${this.filesToMigrate.length} files to migrate\n`);
  }

  private async analyzeChanges() {
    console.log('🔍 Analyzing changes...\n');

    for (const file of this.filesToMigrate) {
      const content = await fs.readFile(file, 'utf-8');
      const changes: string[] = [];

      // Check each pattern
      for (const pattern of this.selectedProvider!.patterns) {
        const matches = content.match(pattern.from);
        if (matches && matches.length > 0) {
          changes.push(`${pattern.description}: ${matches.length} occurrence(s)`);
        }
      }

      if (changes.length > 0) {
        this.changes.set(file, changes);
      }
    }
  }

  private async showPreview() {
    console.log(chalk.bold('📋 Migration Preview:\n'));

    for (const [file, changes] of this.changes) {
      console.log(chalk.cyan(file));
      for (const change of changes) {
        console.log(`  - ${change}`);
      }
      console.log();
    }

    console.log(chalk.yellow(`Total files to be modified: ${this.changes.size}`));
  }

  private async applyChanges() {
    const proceed = await confirm({
      message: 'Do you want to proceed with the migration?',
      default: true,
    });

    if (!proceed) {
      console.log(chalk.yellow('\nMigration cancelled.'));
      return;
    }

    console.log('\n🚀 Applying changes...\n');

    for (const file of this.filesToMigrate) {
      let content = await fs.readFile(file, 'utf-8');
      let modified = false;

      // Replace imports
      for (const imp of this.selectedProvider!.imports.from) {
        if (content.includes(imp)) {
          // Handle different import styles
          content = content
            .replace(new RegExp(`import .* from ['"]${imp}['"];?`, 'g'), '')
            .replace(new RegExp(`const .* = require\\(['"]${imp}['"]\\);?`, 'g'), '');
          modified = true;
        }
      }

      // Add new import if modified
      if (modified && !content.includes('unified-error-handling')) {
        const importStatement = `import { UnifiedErrorHandling } from 'unified-error-handling';\n`;
        
        // Add after other imports
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
      }

      // Apply patterns
      for (const pattern of this.selectedProvider!.patterns) {
        const before = content;
        content = content.replace(pattern.from, pattern.to);
        if (before !== content) {
          modified = true;
        }
      }

      // Write file if modified
      if (modified) {
        await fs.writeFile(file, content);
        console.log(chalk.green(`✓ ${file}`));
      }
    }
  }
}

// Run migration
const migrator = new MigrationTool();
migrator.run().catch(console.error);