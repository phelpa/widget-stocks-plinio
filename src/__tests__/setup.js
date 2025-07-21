// Jest setup file
require("@testing-library/jest-dom");

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock DOM methods that might not be available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear fetch mock
  if (global.fetch.mockClear) {
    global.fetch.mockClear();
  }

  // Clean up DOM
  document.body.innerHTML = "";
});
