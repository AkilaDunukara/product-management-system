export const env = {
  api: {
    baseUrl: '/api',
    timeout: 30000,
    backendUrl: 'http://localhost:3001',
  },
  
  app: {
    name: 'Product Management System',
    version: '1.0.0',
  },
  
  features: {
    notifications: true,
    csvImport: true,
  },
  
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  toast: {
    duration: 3000,
  },
  
  sse: {
    maxNotifications: 50,
    reconnectDelay: 5000,
  },
  
  upload: {
    maxFileSizeMB: 10,
    maxCsvRows: 10000,
  },
  
  business: {
    lowStockThreshold: 10,
  },
  
  dev: {
    debugMode: false,
    enableLogging: false,
    enableDevTools: false,
  },
  
  isDevelopment: false,
  isProduction: true,
  mode: 'test',
};
