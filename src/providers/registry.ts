import { ErrorProvider, ProviderFactory, ProviderRegistry } from '@/types';

/**
 * Provider registry implementation
 */
export class ProviderRegistryImpl implements ProviderRegistry {
  private providers: Map<string, ProviderFactory> = new Map();

  /**
   * Register a provider
   */
  register(name: string, factory: ProviderFactory): void {
    if (this.providers.has(name)) {
      console.warn(`Provider ${name} is already registered. Overwriting...`);
    }
    this.providers.set(name, factory);
  }

  /**
   * Get a provider instance
   */
  get(name: string): ErrorProvider | undefined {
    const factory = this.providers.get(name);
    if (!factory) {
      return undefined;
    }
    return factory();
  }

  /**
   * Check if provider exists
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): Map<string, ProviderFactory> {
    return new Map(this.providers);
  }

  /**
   * Unregister a provider
   */
  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Get registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Create default registry instance
export const defaultRegistry = new ProviderRegistryImpl();
