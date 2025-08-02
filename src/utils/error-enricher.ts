import type { NormalizedError } from '../store/types';

export function enrichError(error: NormalizedError): NormalizedError {
  // Add browser/environment info
  if (typeof window !== 'undefined') {
    error.context.device = {
      ...error.context.device,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
    };

    // Add URL info
    error.context.extra = {
      ...error.context.extra,
      url: window.location.href,
      referrer: document.referrer,
    };
  }

  // Generate fingerprint if not provided
  if (!error.fingerprint) {
    error.fingerprint = generateFingerprint(error);
  }

  // Parse stack trace for better insights
  if (error.stack) {
    const parsedStack = parseStackTrace(error.stack);
    error.context.extra = {
      ...error.context.extra,
      parsedStack,
    };
  }

  return error;
}

function generateFingerprint(error: NormalizedError): string {
  // Create a fingerprint based on error type, message, and stack
  const parts = [
    error.type || 'Error',
    error.message,
    error.stack ? extractTopStackFrame(error.stack) : '',
  ].filter(Boolean);

  return parts.join('|').replace(/\s+/g, ' ').trim();
}

function extractTopStackFrame(stack: string): string {
  const lines = stack.split('\n');
  // Find first line that looks like a stack frame
  for (const line of lines) {
    if (line.includes('at ') && !line.includes('Error')) {
      return line.trim();
    }
  }
  return '';
}

function parseStackTrace(stack: string): Array<{
  function?: string;
  file?: string;
  line?: number;
  column?: number;
}> {
  const frames: Array<{
    function?: string;
    file?: string;
    line?: number;
    column?: number;
  }> = [];

  const lines = stack.split('\n');
  
  for (const line of lines) {
    // Skip non-frame lines
    if (!line.includes('at ')) continue;

    // Extract function name
    const functionMatch = line.match(/at\s+([^\s]+)\s+\(/);
    const functionName = functionMatch ? functionMatch[1] : '<anonymous>';

    // Extract file info
    const fileMatch = line.match(/\((.+):(\d+):(\d+)\)/);
    if (fileMatch) {
      frames.push({
        function: functionName,
        file: fileMatch[1],
        line: parseInt(fileMatch[2], 10),
        column: parseInt(fileMatch[3], 10),
      });
    } else {
      // Try to match file info without parentheses
      const altMatch = line.match(/at\s+(.+):(\d+):(\d+)/);
      if (altMatch) {
        frames.push({
          file: altMatch[1],
          line: parseInt(altMatch[2], 10),
          column: parseInt(altMatch[3], 10),
        });
      }
    }
  }

  return frames;
}