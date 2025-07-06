/**
 * Generic localStorage utility functions with error handling and type safety
 */

export interface StorageOptions<T> {
  /** Keys to exclude when saving (for privacy/security) */
  excludeKeys?: (keyof T)[];
  /** Custom validation function for loaded data */
  validator?: (data: any) => boolean;
}

/**
 * Load data from localStorage with type safety and fallback
 * @param key Storage key
 * @param defaultValue Default value if no data found or parsing fails
 * @param options Storage options
 * @returns Parsed data or default value
 */
export function loadFromStorage<T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  options: StorageOptions<T> = {}
): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      return defaultValue;
    }

    const parsedData = JSON.parse(saved);

    // Run custom validation if provided
    if (options.validator && !options.validator(parsedData)) {
      console.warn(`Storage validation failed for key: ${key}`);
      return defaultValue;
    }

    // Merge with defaults to ensure all properties exist
    return { ...defaultValue, ...parsedData };
  } catch (error) {
    console.warn(`Failed to load data from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * Save data to localStorage with optional key exclusion
 * @param key Storage key
 * @param value Data to save
 * @param options Storage options
 */
export function saveToStorage<T extends Record<string, any>>(
  key: string,
  value: T,
  options: StorageOptions<T> = {}
): void {
  try {
    let dataToSave = { ...value };

    // Remove excluded keys if specified
    if (options.excludeKeys && options.excludeKeys.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [options.excludeKeys[0] as string]: _, ...rest } = dataToSave;
      dataToSave = rest as T;

      // Handle multiple excluded keys
      options.excludeKeys.slice(1).forEach((excludeKey) => {
        delete (dataToSave as any)[excludeKey];
      });
    }

    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    console.warn(`Failed to save data to localStorage (key: ${key}):`, error);
  }
}

/**
 * Remove data from localStorage
 * @param key Storage key
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(
      `Failed to remove data from localStorage (key: ${key}):`,
      error
    );
  }
}

/**
 * Check if localStorage is available
 * @returns true if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all keys from localStorage with a specific prefix
 * @param prefix Key prefix to filter by
 * @returns Array of matching keys
 */
export function getStorageKeys(prefix?: string): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.warn("Failed to get localStorage keys:", error);
    return [];
  }
}
