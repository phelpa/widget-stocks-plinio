async function getRealStockData(symbol) {
  console.log(`🔍 Starting parallel API requests for symbol: ${symbol}`);

  const apis = [
    // API #1: Alpha Vantage
    async () => {
      console.log(`📡 API #1 (Alpha Vantage) - Fetching data for ${symbol}`);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`;
      console.log(`📡 Alpha Vantage URL: ${url}`);

      const response = await fetch(url);
      console.log(`📡 Alpha Vantage response status: ${response.status}`);

      const data = await response.json();
      console.log(`📡 Alpha Vantage response for ${symbol}:`, data);

      if (
        data["Global Quote"] &&
        Object.keys(data["Global Quote"]).length > 0
      ) {
        const quote = data["Global Quote"];
        const currentPrice = parseFloat(quote["05. price"]);
        const change = parseFloat(quote["09. change"]);
        const changePercentStr = quote["10. change percent"];
        const changePercent = parseFloat(
          changePercentStr ? changePercentStr.replace("%", "") : "0"
        );

        // Validate numbers
        if (isNaN(currentPrice) || isNaN(change)) {
          throw new Error("Invalid price data from Alpha Vantage");
        }

        const result = {
          symbol: symbol.toUpperCase(),
          companyName: symbol.toUpperCase(), // Use symbol since Alpha Vantage doesn't provide company name
          currentPrice: currentPrice,
          change: change,
          changePercent: changePercent,
          lastUpdate: new Date().toISOString(),
          currency: "USD",
          source: "Alpha Vantage",
        };
        console.log(`✅ Alpha Vantage success for ${symbol}:`, result);
        return result;
      }
      throw new Error("No valid data in Alpha Vantage response");
    },

    // API #2: Using a CORS proxy for Yahoo Finance
    async () => {
      console.log(`📡 API #2 (Yahoo Finance) - Fetching data for ${symbol}`);
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const fullUrl = proxyUrl + encodeURIComponent(targetUrl);
      console.log(`📡 Yahoo Finance URL: ${fullUrl}`);

      const response = await fetch(fullUrl);
      console.log(`📡 Yahoo Finance response status: ${response.status}`);

      const data = await response.json();
      console.log(`📡 Yahoo Finance response for ${symbol}:`, data);

      if (!data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error("Invalid Yahoo Finance response structure");
      }

      const result = data.chart.result[0];
      const meta = result.meta;

      const currentPrice = parseFloat(
        meta.regularMarketPrice || meta.chartPreviousClose
      );
      const previousClose = parseFloat(
        meta.chartPreviousClose || meta.previousClose
      );

      if (isNaN(currentPrice) || isNaN(previousClose)) {
        throw new Error("Invalid price data from Yahoo Finance");
      }

      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const apiResult = {
        symbol: symbol.toUpperCase(),
        companyName: meta.longName || meta.shortName || symbol.toUpperCase(), // Use company name from Yahoo if available
        currentPrice: currentPrice,
        change: change,
        changePercent: changePercent,
        lastUpdate: new Date().toISOString(),
        currency: meta.currency || "USD",
        source: "Yahoo Finance",
      };
      console.log(`✅ Yahoo Finance success for ${symbol}:`, apiResult);
      return apiResult;
    },
  ];

  // Create promises that resolve with either success or null on failure
  const apiPromises = apis.map(async (apiFunc, index) => {
    try {
      const data = await apiFunc();

      // Validate the result
      if (
        isNaN(data.currentPrice) ||
        isNaN(data.change) ||
        isNaN(data.changePercent)
      ) {
        console.warn(`❌ API ${index + 1} returned invalid data for ${symbol}`);
        return null;
      }

      console.log(
        `🎉 API ${index + 1} (${data.source}) succeeded for ${symbol}`
      );
      return data;
    } catch (error) {
      console.warn(`❌ API ${index + 1} failed for ${symbol}:`, error.message);
      return null;
    }
  });

  console.log(`🏁 Racing ${apis.length} APIs in parallel for ${symbol}...`);

  // Use Promise.race to return as soon as ANY API succeeds
  try {
    // Race all promises - first non-null result wins
    const raceResult = await Promise.race(
      apiPromises.map(async (promise, index) => {
        const result = await promise;
        if (result !== null) {
          console.log(`🎉 Winner: ${result.source} for ${symbol}`);
          return result;
        }
        // If this API failed, wait a bit and throw to continue the race
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error(`API ${index + 1} failed`);
      })
    );

    return raceResult;
  } catch (raceError) {
    // If the race fails, fall back to waiting for all results
    console.log(
      `🔄 All APIs racing failed, checking all results for ${symbol}...`
    );

    try {
      const results = await Promise.allSettled(apiPromises);

      // Find any successful result
      for (const result of results) {
        if (result.status === "fulfilled" && result.value !== null) {
          console.log(
            `🎉 Fallback winner: ${result.value.source} for ${symbol}`
          );
          return result.value;
        }
      }

      // If we get here, all APIs failed
      console.error(`💥 All APIs failed for ${symbol}`);
      throw new Error(
        `Unable to fetch data for ${symbol}. Please try again later.`
      );
    } catch (error) {
      console.error(
        `💥 Error during API fallback for ${symbol}:`,
        error.message
      );
      throw new Error(
        `Unable to fetch data for ${symbol}. Please try again later.`
      );
    }
  }
}

async function getRealSparklineData(symbol = "AAPL") {
  console.log(`📊 Fetching sparkline data for ${symbol}`);
  try {
    const proxyUrl = "https://api.allorigins.win/raw?url=";
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=7d`;
    const fullUrl = proxyUrl + encodeURIComponent(targetUrl);
    console.log(`📊 Sparkline URL: ${fullUrl}`);

    const response = await fetch(fullUrl);
    console.log(`📊 Sparkline response status: ${response.status}`);

    const data = await response.json();
    console.log(`📊 Sparkline response for ${symbol}:`, data);

    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error("Invalid response from Yahoo Finance API");
    }

    const result = data.chart.result[0];
    const closes = result.indicators.quote[0].close;

    const validCloses = closes
      .filter((price) => price !== null && !isNaN(price))
      .slice(-7);

    console.log(`📊 Sparkline data for ${symbol}:`, validCloses);
    return validCloses.length > 0 && validCloses;
  } catch (error) {
    console.warn(
      `❌ Failed to fetch sparkline data for ${symbol}:`,
      error.message
    );
    return [];
  }
}

// Format price with proper validation
function formatPrice(price, currency = "USD") {
  if (isNaN(price) || price === null || price === undefined) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
}

function formatPercentage(percent) {
  if (isNaN(percent) || percent === null || percent === undefined) {
    return "0.00%";
  }

  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function createSparkline(data, width = 100, height = 30) {
  if (!data || data.length === 0) return "";

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg width="${width}" height="${height}" style="margin-left: 10px;">
      <polyline
        fill="none"
        stroke="#10b981"
        stroke-width="2"
        points="${points}"
      />
    </svg>
  `;
}

function createLoadingHTML(symbol, isFloating = false) {
  const floatingStyles = isFloating
    ? `
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 1000;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    max-width: 280px;
  `
    : "";

  return `
    <div style="
      font-family: 'Arial', sans-serif;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      max-width: 320px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
      ${floatingStyles}
    ">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
            ${symbol}
          </h3>
          <p style="margin: 0; font-size: 12px; color: #6b7280; margin-top: 2px;">
            Loading...
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 700; color: #6b7280;">
            <div style="
              width: 20px; 
              height: 20px; 
              border: 2px solid #f3f4f6; 
              border-top: 2px solid #10b981; 
              border-radius: 50%; 
              animation: spin 1s linear infinite;
              margin-left: auto;
            "></div>
          </div>
        </div>
      </div>

      <!-- Loading Content -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center;">
          <span style="color: #9ca3af; font-size: 14px;">
            Fetching real-time data...
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 8px; font-size: 11px; color: #9ca3af;">
        Loading stock data...
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
}

function createWidgetHTML(stockData, sparklineData = [], isFloating = false) {
  const changeColor = stockData.change >= 0 ? "#10b981" : "#ef4444";
  const changeIcon = stockData.change >= 0 ? "↗" : "↘";
  const sparkline =
    sparklineData.length > 0 ? createSparkline(sparklineData) : "";

  const floatingStyles = isFloating
    ? `
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 1000;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    max-width: 280px;
  `
    : "";

  return `
    <div style="
      font-family: 'Arial', sans-serif;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      max-width: 320px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
      ${floatingStyles}
    " onmouseover="this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.boxShadow='${
      isFloating
        ? "0 10px 25px rgba(0, 0, 0, 0.2)"
        : "0 1px 3px rgba(0, 0, 0, 0.1)"
    }'">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
            ${stockData.symbol}
          </h3>
          <p style="margin: 0; font-size: 12px; color: #6b7280; margin-top: 2px;">
            ${stockData.companyName}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 700; color: #111827;">
            ${formatPrice(stockData.currentPrice, stockData.currency)}
          </div>
        </div>
      </div>

      <!-- Price Change -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center;">
          <span style="color: ${changeColor}; font-size: 16px; margin-right: 4px;">
            ${changeIcon}
          </span>
          <span style="color: ${changeColor}; font-weight: 600; font-size: 14px;">
            ${formatPrice(Math.abs(stockData.change), stockData.currency)}
          </span>
          <span style="color: ${changeColor}; font-weight: 600; font-size: 14px; margin-left: 6px;">
            (${formatPercentage(stockData.changePercent)})
          </span>
        </div>
        ${sparkline}
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 8px; font-size: 11px; color: #9ca3af;">
        Last updated: ${new Date(stockData.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  `;
}

// Main Widget Class
class StockWidget {
  constructor(config) {
    this.containerId = config.containerId;
    this.symbol = config.symbol || "AAPL";
    this.apiKey = config.apiKey;
    this.showSparkline = config.showSparkline !== false;
    this.isFloating = config.isFloating || false;
    this.onClick = config.onClick;
    this.isInitialRender = true; // Track if this is the first render

    if (!this.containerId) {
      throw new Error("containerId is required");
    }

    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }

    this.render();
  }

  async render() {
    console.log(
      `🎨 Starting render for ${this.symbol} widget (initial: ${this.isInitialRender})`
    );

    // Show loading state only on initial render
    if (this.isInitialRender) {
      const loadingHTML = createLoadingHTML(this.symbol, this.isFloating);
      this.container.innerHTML = loadingHTML;
      console.log(`⏳ Loading state displayed for ${this.symbol}`);

      // Mark that initial render is complete immediately after showing loading
      this.isInitialRender = false;
    }

    try {
      console.log(`🔄 Fetching stock data for ${this.symbol}...`);
      const stockData = await getRealStockData(this.symbol);

      console.log(`🔄 Fetching sparkline data for ${this.symbol}...`);
      const sparklineData = this.showSparkline
        ? await getRealSparklineData(this.symbol)
        : [];

      const widgetHTML = createWidgetHTML(
        stockData,
        sparklineData,
        this.isFloating
      );
      this.container.innerHTML = widgetHTML;

      if (this.onClick) {
        this.container.style.cursor = "pointer";
        this.container.onclick = () => this.onClick(this.symbol);
      }

      console.log(
        `✅ Widget rendered successfully for ${this.symbol}:`,
        stockData
      );
    } catch (error) {
      console.error(`❌ Error rendering widget for ${this.symbol}:`, error);

      // Show a user-friendly error state instead of technical error
      this.container.innerHTML = `
        <div style="
          font-family: 'Arial', sans-serif;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          max-width: 320px;
          text-align: center;
          color: #6b7280;
        ">
          <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
            ${this.symbol}
          </h3>
          <p style="margin: 0; font-size: 14px;">
            Market data temporarily unavailable
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            Please try again in a moment
          </p>
        </div>
      `;
    }
  }

  refresh() {
    console.log(`🔄 Refreshing ${this.symbol} widget (no loading state)`);
    this.render();
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

// Global API
const StocksSnapshot = {
  async init(config) {
    console.log("🚀 StocksSnapshot.init called with:", config);
    const widget = new StockWidget(config);
    return widget;
  },

  version: "1.0.0",
};

// Export for UMD
if (typeof module !== "undefined" && module.exports) {
  module.exports = StocksSnapshot;
} else if (typeof window !== "undefined") {
  window.StocksSnapshot = StocksSnapshot;
}
