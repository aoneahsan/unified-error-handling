import { errorStore } from '../store/error-store';

export class ConsoleInterceptor {
  private originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
  };

  private enabled = false;

  enable(): void {
    if (this.enabled) return;

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error.apply(console, args);
      
      // Create error from console.error arguments
      const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
      
      errorStore.captureError(error, {
        extra: {
          source: 'console.error',
          consoleArgs: args.slice(1),
        },
      });

      // Add breadcrumb
      errorStore.addBreadcrumb({
        message: `console.error: ${args.map(arg => String(arg)).join(' ')}`,
        category: 'console',
        level: 'error',
      });
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn.apply(console, args);
      
      errorStore.addBreadcrumb({
        message: `console.warn: ${args.map(arg => String(arg)).join(' ')}`,
        category: 'console',
        level: 'warning',
      });
    };

    // Intercept console.log and console.info for breadcrumbs
    console.log = (...args: any[]) => {
      this.originalConsole.log.apply(console, args);
      
      errorStore.addBreadcrumb({
        message: `console.log: ${args.map(arg => String(arg)).join(' ')}`,
        category: 'console',
        level: 'info',
      });
    };

    console.info = (...args: any[]) => {
      this.originalConsole.info.apply(console, args);
      
      errorStore.addBreadcrumb({
        message: `console.info: ${args.map(arg => String(arg)).join(' ')}`,
        category: 'console',
        level: 'info',
      });
    };

    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) return;

    // Restore original console methods
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;

    this.enabled = false;
  }
}

export const consoleInterceptor = new ConsoleInterceptor();