interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_DEV_SERVER_PORT: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_CSV_IMPORT: string;
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_MAX_PAGE_SIZE: string;
  readonly VITE_TOAST_DURATION: string;
  readonly VITE_SSE_MAX_NOTIFICATIONS: string;
  readonly VITE_SSE_RECONNECT_DELAY: string;
  readonly VITE_MAX_FILE_SIZE_MB: string;
  readonly VITE_MAX_CSV_ROWS: string;
  readonly VITE_LOW_STOCK_THRESHOLD: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_ENABLE_LOGGING?: string;
  readonly VITE_ENABLE_DEV_TOOLS?: string;
}

const getEnvVar = (key: keyof ImportMetaEnv, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvNumber = (key: keyof ImportMetaEnv, defaultValue: number): number => {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: keyof ImportMetaEnv, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  return value ? value === 'true' : defaultValue;
};

export const env = {
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', '/api'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
    backendUrl: getEnvVar('VITE_BACKEND_URL', 'http://localhost:3001'),
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', 'Product Management System'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  },
  
  features: {
    notifications: getEnvBoolean('VITE_ENABLE_NOTIFICATIONS', true),
    csvImport: getEnvBoolean('VITE_ENABLE_CSV_IMPORT', true),
  },
  
  pagination: {
    defaultPageSize: getEnvNumber('VITE_DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getEnvNumber('VITE_MAX_PAGE_SIZE', 100),
  },
  
  toast: {
    duration: getEnvNumber('VITE_TOAST_DURATION', 3000),
  },
  
  sse: {
    maxNotifications: getEnvNumber('VITE_SSE_MAX_NOTIFICATIONS', 50),
    reconnectDelay: getEnvNumber('VITE_SSE_RECONNECT_DELAY', 5000),
  },
  
  upload: {
    maxFileSizeMB: getEnvNumber('VITE_MAX_FILE_SIZE_MB', 10),
    maxCsvRows: getEnvNumber('VITE_MAX_CSV_ROWS', 10000),
  },
  
  business: {
    lowStockThreshold: getEnvNumber('VITE_LOW_STOCK_THRESHOLD', 10),
  },
  
  dev: {
    debugMode: getEnvBoolean('VITE_DEBUG_MODE', false),
    enableLogging: getEnvBoolean('VITE_ENABLE_LOGGING', false),
    enableDevTools: getEnvBoolean('VITE_ENABLE_DEV_TOOLS', false),
  },
  
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};
