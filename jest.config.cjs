module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.js"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.js",
    "<rootDir>/src/**/*.test.js",
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/__tests__/**",
    "!src/**/*.test.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {},
  extensionsToTreatAsEsm: [],
  testTimeout: 10000,
};
