// Export all API services from a single file for easier importing
export * from './apiClient';
export * from './authApi';
export * from './userApi';
export * from './filterApi';
export * from './imageApi';
export * from './processingApi';

// Keep the original filters.ts exports for backward compatibility
// These can be gradually migrated to the new API implementation
export * from './filters';
