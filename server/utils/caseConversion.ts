/**
 * Converte snake_case para camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converte todas as chaves de um objeto/array de snake_case para camelCase recursivamente
 */
export function keysToCamelCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item)) as T;
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = keysToCamelCase(obj[key]);
      return acc;
    }, {} as any) as T;
  }
  
  return obj;
}
