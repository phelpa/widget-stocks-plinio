# 📈 R2StocksSnapshot Widget

A lightweight, embeddable stock widget that displays real-time stock data. Built with vanilla JavaScript and designed to work on any website.

## ✨ Features

- **Real-time Data**: Live stock prices from multiple API sources
- **Responsive Design**: Works on desktop and mobile devices

## 📊 Demo

Open `index.html` in your browser to see the widget in action with:

- Microsoft (MSFT) stock widget
- Dynamic widget creator for any stock symbol

## 🚀 How to Get Widget Code

1. Open `index.html` in your browser
2. Use the "Add New Widget" section
3. Enter a stock symbol (e.g., AAPL, TSLA, MSFT)
4. Click "Create Widget"
5. Copy the generated widget code from the page
6. Paste it into your website

The widget code will be automatically generated for you to copy and embed.

## 🧪 Testing

### Run Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for CI
npm run test:ci
```

### Test Coverage

The test suite covers:

- ✅ **Environment Setup**: jsdom, mocks, DOM manipulation
- ✅ **Module Loading**: Widget source code loading and evaluation
- ✅ **API Functions**: Stock data fetching and error handling
- ✅ **Utility Functions**: Price/percentage formatting
- ✅ **Widget Integration**: Loading states and rendering
- ✅ **Error Scenarios**: Network failures and invalid data

Current test results:

```
✓ should have jsdom environment
✓ should load widget source code
✓ should format prices correctly
✓ should format percentages correctly
✓ should handle API failures gracefully
✓ should show loading state initially

Test Suites: 1 passed
Tests: 9 passed
```

## 🏗 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure

```
stock-widget/
├── src/
│   ├── widget.js              # Main widget source
│   └── __tests__/
│       ├── basic.test.js      # Core functionality tests
│       └── setup.js           # Test environment setup
├── dist/
│   └── stocks.umd.cjs         # Built widget bundle
├── index.html                 # Demo page
├── jest.config.cjs            # Test configuration
└── package.json              # Dependencies and scripts
```

### Build Process

1. **Source**: `src/widget.js` contains all widget logic
2. **Bundle**: Vite builds UMD bundle to `dist/stocks.umd.cjs`
3. **Test**: Jest runs comprehensive test suite

## 📈 Performance

### Optimizations

- **Parallel API Calls**: Uses `Promise.race()` for fastest response
- **Efficient Bundling**: Single 10KB minified file
- **CDN Ready**: Optimized for content delivery networks
- **Minimal Dependencies**: No external libraries
- **Lazy Loading**: Only loads when widget is initialized

### Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🛡 Security

- **CSP Compatible**: Works with Content Security Policy
- **XSS Protection**: Built-in security headers
- **Input Validation**: All user inputs are sanitized
- **Error Boundaries**: Graceful error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Build the widget: `npm run build`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
