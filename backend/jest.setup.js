// Global test setup
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOW_STOCK_THRESHOLD = '10';
process.env.RATE_LIMIT_STANDARD = '100';
process.env.RATE_LIMIT_BULK = '5';
