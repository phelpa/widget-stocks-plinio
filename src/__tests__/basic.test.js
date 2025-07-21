// Basic integration test for the stock widget
describe("Stock Widget - Basic Tests", () => {
  let container;

  beforeEach(() => {
    // Create a container element
    container = document.createElement("div");
    container.id = "test-widget-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Environment Setup", () => {
    test("should have jsdom environment", () => {
      expect(document).toBeDefined();
      expect(window).toBeDefined();
      expect(global.fetch).toBeDefined();
    });

    test("should have container element", () => {
      expect(container).toBeDefined();
      expect(container.id).toBe("test-widget-container");
      expect(document.getElementById("test-widget-container")).toBe(container);
    });

    test("should have mocked fetch", () => {
      expect(typeof global.fetch).toBe("function");
      expect(global.fetch.mockClear).toBeDefined();
    });
  });

  describe("StocksSnapshot Module Loading", () => {
    test("should load widget source code", () => {
      const fs = require("fs");
      const path = require("path");

      const widgetPath = path.join(__dirname, "../widget.js");
      expect(() => {
        const widgetSource = fs.readFileSync(widgetPath, "utf8");
        expect(widgetSource).toContain("StocksSnapshot");
        expect(widgetSource).toContain("getRealStockData");
      }).not.toThrow();
    });

    test("should create StocksSnapshot module", () => {
      const fs = require("fs");
      const path = require("path");

      const widgetSource = fs.readFileSync(
        path.join(__dirname, "../widget.js"),
        "utf8"
      );
      const module = { exports: {} };

      // Execute the widget code
      eval(`
        (function(module, window, document) {
          ${widgetSource}
        })(module, window, document);
      `);

      expect(module.exports).toBeDefined();
      expect(module.exports.init).toBeDefined();
      expect(module.exports.version).toBeDefined();
      expect(typeof module.exports.init).toBe("function");
    });
  });

  describe("API Functions", () => {
    let getRealStockData, formatPrice, formatPercentage;

    beforeEach(() => {
      const fs = require("fs");
      const path = require("path");

      const widgetSource = fs.readFileSync(
        path.join(__dirname, "../widget.js"),
        "utf8"
      );
      const context = {};

      eval(`
        (function(module, window, document) {
          ${widgetSource}
          
          this.getRealStockData = getRealStockData;
          this.formatPrice = formatPrice;
          this.formatPercentage = formatPercentage;
        }).call(context, {exports: {}}, window, document);
      `);

      getRealStockData = context.getRealStockData;
      formatPrice = context.formatPrice;
      formatPercentage = context.formatPercentage;
    });

    test("should format prices correctly", () => {
      expect(formatPrice(150.25)).toBe("$150.25");
      expect(formatPrice(1000.5)).toBe("$1,000.50");
      expect(formatPrice(NaN)).toBe("$0.00");
      expect(formatPrice(null)).toBe("$0.00");
    });

    test("should format percentages correctly", () => {
      expect(formatPercentage(5.25)).toBe("+5.25%");
      expect(formatPercentage(-3.75)).toBe("-3.75%");
      expect(formatPercentage(0)).toBe("+0.00%");
      expect(formatPercentage(NaN)).toBe("0.00%");
    });

    test("should handle API failures gracefully", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      await expect(getRealStockData("AAPL")).rejects.toThrow(
        "Unable to fetch data for AAPL. Please try again later."
      );
    });
  });

  describe("Widget Integration", () => {
    let StocksSnapshot;

    beforeEach(() => {
      const fs = require("fs");
      const path = require("path");

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

      StocksSnapshot = module.exports;
    });

    test("should show loading state initially", async () => {
      // Mock a slow API response
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 200,
                  json: () =>
                    Promise.resolve({
                      chart: {
                        result: [
                          {
                            meta: {
                              regularMarketPrice: 150.25,
                              chartPreviousClose: 148.5,
                              currency: "USD",
                            },
                          },
                        ],
                      },
                    }),
                }),
              100
            )
          )
      );

      // Start widget initialization
      const initPromise = StocksSnapshot.init({
        containerId: "test-widget-container",
        symbol: "AAPL",
      });

      // Check for loading state immediately
      await new Promise((resolve) => setTimeout(resolve, 10));

      const content = container.innerHTML;
      expect(content).toContain("Loading");

      // Wait for completion
      await initPromise;
    });
  });
});
