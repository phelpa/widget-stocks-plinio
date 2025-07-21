# Stock Widget Test Suite

This project includes comprehensive unit tests using Jest and Testing Library to ensure the stock widget functions correctly across all scenarios.

## Test Setup

### Dependencies

- **Jest**: Testing framework
- **@testing-library/jest-dom**: DOM testing utilities
- **@testing-library/dom**: DOM manipulation for tests
- **jest-environment-jsdom**: Browser-like environment for testing

### Configuration

- `jest.config.cjs`: Jest configuration with jsdom environment
- `src/__tests__/setup.js`: Test environment setup with mocks

## Test Categories

### 1. **Basic Integration Tests** (`basic.test.js`)

✅ **Covers core functionality and integration**

**Environment Setup:**

- jsdom environment verification
- Container element creation
- Fetch mocking

**Module Loading:**

- Widget source code loading
- StocksSnapshot module creation
- Function availability

**Configuration Validation:**

- Error handling for missing containerId
- Error handling for non-existent containers
- Default parameter handling

**API Functions:**

- Price formatting (`formatPrice`)
- Percentage formatting (`formatPercentage`)
- Successful API responses
- API failure handling

**Widget Integration:**

- Loading state display
- Successful widget creation
- Error state handling

### 2. **Detailed Widget Tests** (`widget.test.js`)

🔧 **Comprehensive widget behavior testing**

**init() Behavior:**

- Successful initialization with valid config
- Widget instance property verification
- Default symbol usage

**Config Parsing and Error Handling:**

- Missing containerId validation
- Non-existent container validation
- Optional parameter defaults
- Custom configuration preservation

**Rendering Logic:**

- Initial loading state
- Stock data rendering
- Error state display
- Invalid API response handling
- Refresh behavior (no loading on subsequent calls)

**API Response Handling:**

- Yahoo Finance API response parsing
- Alpha Vantage API response parsing
- Numeric data validation
- Multiple API fallback

**Widget Methods:**

- `refresh()` method functionality
- `destroy()` method cleanup

### 3. **Utility Function Tests** (`utils.test.js`)

🛠️ **Individual utility function testing**

**formatPrice:**

- Valid price formatting
- Invalid input handling
- Multiple currency support
- Large number handling

**formatPercentage:**

- Positive/negative percentage formatting
- Zero handling
- Invalid input graceful handling
- Decimal precision

**createSparkline:**

- SVG sparkline generation
- Custom dimensions
- Invalid data handling
- Single data point handling
- Identical values handling

**createWidgetHTML:**

- Complete widget HTML generation
- Negative change styling
- Sparkline inclusion
- Floating styles
- Last update formatting

**createLoadingHTML:**

- Loading HTML with symbol
- Floating styles application
- CSS animation inclusion
- Loading spinner styles

### 4. **API Function Tests** (`api.test.js`)

🌐 **API interaction and error handling**

**getRealStockData:**

- Yahoo Finance API success
- Alpha Vantage fallback
- Invalid response handling
- Numeric data validation
- Network error handling
- Symbol case handling
- Percentage string parsing

**getRealSparklineData:**

- Sparkline data retrieval
- Null value filtering
- Data point limiting (last 7)
- API failure handling
- Invalid response structure
- Default symbol usage
- Empty data handling

**Error Scenarios:**

- HTTP error status codes
- Malformed JSON responses
- Missing fetch implementation

## Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for CI
npm run test:ci

# Run specific test file
npm test -- src/__tests__/basic.test.js
```

## Test Coverage Goals

- **Functions**: 95%+ coverage
- **Lines**: 90%+ coverage
- **Branches**: 85%+ coverage
- **Statements**: 90%+ coverage

## Key Testing Patterns

### 1. **Module Loading Pattern**

```javascript
const widgetSource = fs.readFileSync(
  path.join(__dirname, "../widget.js"),
  "utf8"
);
const module = { exports: {} };

eval(`
  (function(module, window, document) {
    ${widgetSource}
  })(module, window, document);
`);

const StocksSnapshot = module.exports;
```

### 2. **API Mocking Pattern**

```javascript
global.fetch.mockResolvedValueOnce({
  status: 200,
  json: () => Promise.resolve(mockResponse),
});
```

### 3. **DOM Testing Pattern**

```javascript
const container = document.createElement("div");
container.id = "test-widget-container";
document.body.appendChild(container);

// Test widget creation
await StocksSnapshot.init({
  containerId: "test-widget-container",
  symbol: "AAPL",
});

expect(container.innerHTML).toContain("AAPL");
```

### 4. **Error Testing Pattern**

```javascript
global.fetch.mockRejectedValue(new Error("Network error"));

await expect(getRealStockData("AAPL")).rejects.toThrow(
  "Unable to fetch data for AAPL. Please try again later."
);
```

## Mock Strategy

### Global Mocks

- `global.fetch`: HTTP request mocking
- `console`: Silent console methods to reduce test noise
- `window.matchMedia`: DOM method mocking

### Test-Specific Mocks

- API responses with various scenarios
- Network failures and timeouts
- Invalid data structures
- Missing DOM elements

## Best Practices Applied

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Proper teardown in `afterEach` hooks
3. **Realistic Data**: Mock responses mirror real API structures
4. **Edge Cases**: Tests cover error conditions and invalid inputs
5. **Async Handling**: Proper async/await usage throughout
6. **Descriptive Names**: Clear test descriptions explaining what's being tested

## Running Tests

The test suite runs automatically on:

- Pull requests
- Push to main branch
- Local development with `npm test`

All tests must pass before merging code changes.
