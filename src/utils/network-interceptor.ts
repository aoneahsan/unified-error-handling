import { errorStore } from '../store/error-store';

// Extended XMLHttpRequest interface to add custom properties
interface ExtendedXHR extends XMLHttpRequest {
  _url?: string;
  _method?: string;
  _startTime?: number;
}

export class NetworkInterceptor {
  private enabled = false;
  private originalFetch = typeof window !== 'undefined' ? window.fetch : undefined;
  private xhrPrototype = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype : undefined;
  private originalOpen = this.xhrPrototype?.open;
  private originalSend = this.xhrPrototype?.send;

  enable(): void {
    if (this.enabled || typeof window === 'undefined' || !this.originalFetch || !this.xhrPrototype) return;

    // Intercept fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      const method = init?.method || 'GET';
      const startTime = Date.now();

      try {
        const response = await this.originalFetch!.apply(window, args);
        const duration = Date.now() - startTime;

        // Add breadcrumb for successful request
        errorStore.addBreadcrumb({
          message: `${method} ${url} (${response.status})`,
          category: 'fetch',
          level: response.ok ? 'info' : 'warning',
          data: {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            duration,
          },
        });

        // Capture error for failed requests
        if (!response.ok && response.status >= 400) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          errorStore.captureError(error, {
            extra: {
              source: 'fetch',
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              duration,
            },
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Add breadcrumb for failed request
        errorStore.addBreadcrumb({
          message: `${method} ${url} (failed)`,
          category: 'fetch',
          level: 'error',
          data: {
            method,
            url,
            error: String(error),
            duration,
          },
        });

        // Capture the error
        errorStore.captureError(error as Error, {
          extra: {
            source: 'fetch',
            url,
            method,
            duration,
          },
        });

        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const self = this;
    this.xhrPrototype!.open = function(this: ExtendedXHR, method: string, url: string, ...args: any[]) {
      this._method = method;
      this._url = url;
      this._startTime = Date.now();
      return self.originalOpen!.apply(this, [method, url, ...args] as any);
    };

    this.xhrPrototype!.send = function(this: ExtendedXHR, ...args: any[]) {
      const xhr = this as ExtendedXHR;
      
      // Add event listeners
      xhr.addEventListener('load', function() {
        const duration = Date.now() - (xhr._startTime || 0);
        
        errorStore.addBreadcrumb({
          message: `${xhr._method} ${xhr._url} (${xhr.status})`,
          category: 'xhr',
          level: xhr.status >= 200 && xhr.status < 400 ? 'info' : 'warning',
          data: {
            method: xhr._method,
            url: xhr._url,
            status: xhr.status,
            statusText: xhr.statusText,
            duration,
          },
        });

        // Capture error for failed requests
        if (xhr.status >= 400) {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          errorStore.captureError(error, {
            extra: {
              source: 'xhr',
              url: xhr._url,
              method: xhr._method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration,
            },
          });
        }
      });

      xhr.addEventListener('error', function() {
        const duration = Date.now() - (xhr._startTime || 0);
        
        errorStore.addBreadcrumb({
          message: `${xhr._method} ${xhr._url} (failed)`,
          category: 'xhr',
          level: 'error',
          data: {
            method: xhr._method,
            url: xhr._url,
            duration,
          },
        });

        const error = new Error(`XHR failed: ${xhr._method} ${xhr._url}`);
        errorStore.captureError(error, {
          extra: {
            source: 'xhr',
            url: xhr._url,
            method: xhr._method,
            duration,
          },
        });
      });

      return self.originalSend!.apply(this, args as any);
    };

    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled || typeof window === 'undefined' || !this.originalFetch || !this.xhrPrototype) return;

    // Restore original methods
    window.fetch = this.originalFetch;
    if (this.originalOpen) this.xhrPrototype.open = this.originalOpen;
    if (this.originalSend) this.xhrPrototype.send = this.originalSend;

    this.enabled = false;
  }
}

export const networkInterceptor = new NetworkInterceptor();