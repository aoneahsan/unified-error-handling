import { Breadcrumb, ErrorLevel } from '@/types';

/**
 * Options for breadcrumb manager
 */
export interface BreadcrumbManagerOptions {
  /**
   * Maximum number of breadcrumbs to store
   */
  maxBreadcrumbs?: number;

  /**
   * Enable console tracking
   */
  consoleTracking?: boolean;

  /**
   * Enable network tracking
   */
  networkTracking?: boolean;

  /**
   * Enable DOM tracking
   */
  domTracking?: boolean;

  /**
   * Console methods to track
   */
  consoleMethods?: string[];

  /**
   * URL patterns to ignore for network tracking
   */
  ignoreUrls?: (string | RegExp)[];
}

/**
 * Breadcrumb manager for tracking user actions and events
 */
export class BreadcrumbManager {
  private breadcrumbs: Breadcrumb[] = [];
  private options: Required<BreadcrumbManagerOptions>;
  private originalConsoleMethods: Map<string, Function> = new Map();
  private observers: Array<(breadcrumb: Breadcrumb) => void> = [];

  constructor(options: BreadcrumbManagerOptions = {}) {
    this.options = {
      maxBreadcrumbs: options.maxBreadcrumbs || 100,
      consoleTracking: options.consoleTracking ?? true,
      networkTracking: options.networkTracking ?? true,
      domTracking: options.domTracking ?? true,
      consoleMethods: options.consoleMethods || ['log', 'info', 'warn', 'error', 'debug'],
      ignoreUrls: options.ignoreUrls || [],
    };

    this.initialize();
  }

  /**
   * Initialize tracking
   */
  private initialize(): void {
    if (this.options.consoleTracking) {
      this.initializeConsoleTracking();
    }

    if (this.options.networkTracking && typeof window !== 'undefined') {
      this.initializeNetworkTracking();
    }

    if (this.options.domTracking && typeof window !== 'undefined') {
      this.initializeDOMTracking();
    }
  }

  /**
   * Add a breadcrumb
   */
  add(breadcrumb: Breadcrumb): void {
    // Add timestamp if not provided
    if (!breadcrumb.timestamp) {
      breadcrumb.timestamp = Date.now();
    }

    // Add to array
    this.breadcrumbs.push(breadcrumb);

    // Limit size
    if (this.breadcrumbs.length > this.options.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.options.maxBreadcrumbs);
    }

    // Notify observers
    this.notifyObservers(breadcrumb);
  }

  /**
   * Get all breadcrumbs
   */
  getAll(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Get recent breadcrumbs
   */
  getRecent(count: number): Breadcrumb[] {
    return this.breadcrumbs.slice(-count);
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.breadcrumbs = [];
  }

  /**
   * Subscribe to breadcrumb additions
   */
  subscribe(observer: (breadcrumb: Breadcrumb) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Initialize console tracking
   */
  private initializeConsoleTracking(): void {
    this.options.consoleMethods.forEach((method) => {
      const originalMethod = (console as any)[method];
      if (originalMethod) {
        this.originalConsoleMethods.set(method, originalMethod);

        (console as any)[method] = (...args: any[]) => {
          // Call original method
          originalMethod.apply(console, args);

          // Add breadcrumb
          this.add({
            message: args.map((arg) => this.serializeArgument(arg)).join(' '),
            category: 'console',
            level: this.getConsoleLevel(method),
            data: {
              method,
              arguments: args.length > 1 ? args : undefined,
            },
          });
        };
      }
    });
  }

  /**
   * Initialize network tracking
   */
  private initializeNetworkTracking(): void {
    // Track fetch requests
    if (typeof window.fetch !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        if (!this.shouldIgnoreUrl(url)) {
          const startTime = Date.now();

          try {
            const response = await originalFetch(input, init);
            const duration = Date.now() - startTime;

            this.add({
              message: `${method} ${url}`,
              category: 'network',
              level: response.ok ? ErrorLevel.INFO : ErrorLevel.WARNING,
              data: {
                method,
                url,
                statusCode: response.status,
                statusText: response.statusText,
                duration,
              },
            });

            return response;
          } catch (error) {
            const duration = Date.now() - startTime;

            this.add({
              message: `${method} ${url} failed`,
              category: 'network',
              level: ErrorLevel.ERROR,
              data: {
                method,
                url,
                error: error instanceof Error ? error.message : String(error),
                duration,
              },
            });

            throw error;
          }
        }

        return originalFetch(input, init);
      };
    }

    // Track XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const XHR = XMLHttpRequest.prototype;
      const originalOpen = XHR.open;
      const originalSend = XHR.send;

      XHR.open = function (method: string, url: string | URL, ...args: any[]) {
        (this as any)._breadcrumb = {
          method,
          url: String(url),
          startTime: Date.now(),
        };
        return originalOpen.apply(this, [method, url, ...args] as any);
      };

      const self = this;
      XHR.send = function (...args: any[]) {
        const xhr = this;
        const breadcrumbData = (xhr as any)._breadcrumb;

        if (breadcrumbData && !self.shouldIgnoreUrl(breadcrumbData.url)) {
          const onreadystatechange = xhr.onreadystatechange;
          xhr.onreadystatechange = function (...eventArgs: any[]) {
            if (xhr.readyState === 4) {
              const duration = Date.now() - breadcrumbData.startTime;

              self.add({
                message: `${breadcrumbData.method} ${breadcrumbData.url}`,
                category: 'network',
                level: xhr.status >= 200 && xhr.status < 400 ? ErrorLevel.INFO : ErrorLevel.WARNING,
                data: {
                  method: breadcrumbData.method,
                  url: breadcrumbData.url,
                  statusCode: xhr.status,
                  statusText: xhr.statusText,
                  duration,
                },
              });
            }

            if (onreadystatechange) {
              return onreadystatechange.apply(xhr, eventArgs);
            }
          }.bind(xhr);
        }

        return originalSend.apply(xhr, args.slice(0, 1));
      };
    }
  }

  /**
   * Initialize DOM tracking
   */
  private initializeDOMTracking(): void {
    // Track clicks
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement;
        const selector = this.getElementSelector(target);

        this.add({
          message: `Click on ${selector}`,
          category: 'ui',
          level: ErrorLevel.INFO,
          data: {
            selector,
            tagName: target.tagName,
            id: target.id || undefined,
            className: target.className || undefined,
            innerText: target.innerText?.substring(0, 100) || undefined,
          },
        });
      },
      true
    );

    // Track form submissions
    document.addEventListener(
      'submit',
      (event) => {
        const form = event.target as HTMLFormElement;
        const selector = this.getElementSelector(form);

        this.add({
          message: `Form submission ${selector}`,
          category: 'ui',
          level: ErrorLevel.INFO,
          data: {
            selector,
            action: form.action || undefined,
            method: form.method || undefined,
          },
        });
      },
      true
    );

    // Track input changes
    document.addEventListener(
      'change',
      (event) => {
        const input = event.target as HTMLInputElement;
        if (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
          const selector = this.getElementSelector(input);

          this.add({
            message: `Input change ${selector}`,
            category: 'ui',
            level: ErrorLevel.INFO,
            data: {
              selector,
              type: input.type || undefined,
              name: input.name || undefined,
              // Don't log actual values for security
            },
          });
        }
      },
      true
    );
  }

  /**
   * Get element selector
   */
  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break;
      } else if (current.className) {
        const classes = current.className.split(' ').filter(Boolean);
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  /**
   * Serialize console argument
   */
  private serializeArgument(arg: any): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return '[Complex Object]';
    }
  }

  /**
   * Get console level
   */
  private getConsoleLevel(method: string): ErrorLevel {
    switch (method) {
      case 'error':
        return ErrorLevel.ERROR;
      case 'warn':
        return ErrorLevel.WARNING;
      case 'info':
        return ErrorLevel.INFO;
      case 'debug':
        return ErrorLevel.DEBUG;
      default:
        return ErrorLevel.INFO;
    }
  }

  /**
   * Check if URL should be ignored
   */
  private shouldIgnoreUrl(url: string): boolean {
    return this.options.ignoreUrls.some((pattern) => {
      if (typeof pattern === 'string') {
        return url.includes(pattern);
      } else {
        return pattern.test(url);
      }
    });
  }

  /**
   * Notify observers
   */
  private notifyObservers(breadcrumb: Breadcrumb): void {
    this.observers.forEach((observer) => {
      try {
        observer(breadcrumb);
      } catch (error) {
        console.error('Error in breadcrumb observer:', error);
      }
    });
  }

  /**
   * Restore original methods
   */
  destroy(): void {
    // Restore console methods
    this.originalConsoleMethods.forEach((original, method) => {
      (console as any)[method] = original;
    });
    this.originalConsoleMethods.clear();

    // Clear breadcrumbs and observers
    this.clear();
    this.observers = [];
  }
}