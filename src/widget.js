// Simple Stock Widget - Real data from CORS-enabled free APIs

// Real stock data fetcher using multiple free APIs
async function getRealStockData(symbol = "AAPL") {
  // Try multiple free APIs that support CORS
  const apis = [
    // API #1: Alpha Vantage demo endpoint (limited but works)
    async () => {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`
      );
      const data = await response.json();

      console.log("Alpha Vantage response for", symbol, ":", data);

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

        return {
          symbol: symbol.toUpperCase(),
          companyName: getCompanyName(symbol.toUpperCase()),
          currentPrice: currentPrice,
          change: change,
          changePercent: changePercent,
          lastUpdate: new Date().toISOString(),
          currency: "USD",
        };
      }
      throw new Error("No valid data in Alpha Vantage response");
    },

    // API #2: Finnhub free tier
    async () => {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`
      );
      const data = await response.json();

      console.log("Finnhub response for", symbol, ":", data);

      if (data.c && data.pc && !isNaN(data.c) && !isNaN(data.pc)) {
        const currentPrice = parseFloat(data.c);
        const previousClose = parseFloat(data.pc);
        const change = data.d || currentPrice - previousClose;
        const changePercent =
          data.dp || ((currentPrice - previousClose) / previousClose) * 100;

        return {
          symbol: symbol.toUpperCase(),
          companyName: getCompanyName(symbol.toUpperCase()),
          currentPrice: currentPrice,
          change: change,
          changePercent: changePercent,
          lastUpdate: new Date().toISOString(),
          currency: "USD",
        };
      }
      throw new Error("Invalid or missing data from Finnhub");
    },

    // API #3: Using a CORS proxy for Yahoo Finance
    async () => {
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      const data = await response.json();

      console.log("Yahoo Finance response for", symbol, ":", data);

      if (!data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error("Invalid Yahoo Finance response structure");
      }

      const result = data.chart.result[0];
      const meta = result.meta;

      const currentPrice = parseFloat(
        meta.regularMarketPrice || meta.previousClose
      );
      const previousClose = parseFloat(meta.previousClose);

      if (isNaN(currentPrice) || isNaN(previousClose)) {
        throw new Error("Invalid price data from Yahoo Finance");
      }

      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: symbol.toUpperCase(),
        companyName: getCompanyName(symbol.toUpperCase()),
        currentPrice: currentPrice,
        change: change,
        changePercent: changePercent,
        lastUpdate: new Date().toISOString(),
        currency: meta.currency || "USD",
      };
    },

    // API #4: IEX Cloud free tier (backup)
    async () => {
      const response = await fetch(
        `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=demo`
      );
      const data = await response.json();

      console.log("IEX Cloud response for", symbol, ":", data);

      if (
        data.latestPrice &&
        data.previousClose &&
        !isNaN(data.latestPrice) &&
        !isNaN(data.previousClose)
      ) {
        const currentPrice = parseFloat(data.latestPrice);
        const previousClose = parseFloat(data.previousClose);
        const change = data.change || currentPrice - previousClose;
        const changePercent = data.changePercent
          ? data.changePercent * 100
          : (change / previousClose) * 100;

        return {
          symbol: symbol.toUpperCase(),
          companyName: data.companyName || getCompanyName(symbol.toUpperCase()),
          currentPrice: currentPrice,
          change: change,
          changePercent: changePercent,
          lastUpdate: new Date().toISOString(),
          currency: "USD",
        };
      }
      throw new Error("Invalid or missing data from IEX Cloud");
    },
  ];

  // Try each API in sequence
  for (let i = 0; i < apis.length; i++) {
    try {
      console.log(`Trying API ${i + 1} for ${symbol}...`);
      const result = await apis[i]();

      // Final validation before returning
      if (
        isNaN(result.currentPrice) ||
        isNaN(result.change) ||
        isNaN(result.changePercent)
      ) {
        throw new Error(`API ${i + 1} returned NaN values`);
      }

      console.log(`✅ Successfully fetched data from API ${i + 1}:`, result);
      return result;
    } catch (error) {
      console.warn(`API ${i + 1} failed for ${symbol}:`, error.message);
      if (i === apis.length - 1) {
        // All APIs failed, use fallback
        console.warn("All APIs failed, using fallback data");
        return getFallbackStockData(symbol);
      }
    }
  }
}

// Real sparkline data fetcher
async function getRealSparklineData(symbol = "AAPL") {
  try {
    // Try CORS proxy for Yahoo Finance sparkline data
    const proxyUrl = "https://api.allorigins.win/raw?url=";
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=7d`;
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
    const data = await response.json();

    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error("Invalid response from Yahoo Finance API");
    }

    const result = data.chart.result[0];
    const closes = result.indicators.quote[0].close;

    // Filter out null values and get last 7 data points
    const validCloses = closes
      .filter((price) => price !== null && !isNaN(price))
      .slice(-7);
    return validCloses.length > 0 ? validCloses : getFallbackSparklineData();
  } catch (error) {
    console.warn(
      "Failed to fetch sparkline data for",
      symbol,
      "- using fallback data:",
      error
    );
    return getFallbackSparklineData();
  }
}

// Company name mapping (since free APIs don't always include company names)
function getCompanyName(symbol) {
  const companies = {
    AAPL: "Apple Inc.",
    MSFT: "Microsoft Corporation",
    GOOGL: "Alphabet Inc.",
    GOOG: "Alphabet Inc.",
    TSLA: "Tesla, Inc.",
    NVDA: "NVIDIA Corporation",
    AMZN: "Amazon.com Inc.",
    META: "Meta Platforms Inc.",
    NFLX: "Netflix Inc.",
    AMD: "Advanced Micro Devices",
    INTC: "Intel Corporation",
    CRM: "Salesforce Inc.",
    ORCL: "Oracle Corporation",
    IBM: "International Business Machines",
    CSCO: "Cisco Systems Inc.",
    SPY: "SPDR S&P 500 ETF",
    QQQ: "Invesco QQQ Trust",
    VTI: "Vanguard Total Stock Market ETF",
  };

  return companies[symbol] || `${symbol} Corporation`;
}

// Fallback data (similar to demo data but marked as fallback)
function getFallbackStockData(symbol = "AAPL") {
  console.log(`🔄 Using fallback data for ${symbol}`);
  const basePrice = 150 + Math.random() * 100;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol: symbol.toUpperCase(),
    companyName: getCompanyName(symbol.toUpperCase()) + " (Demo)",
    currentPrice: basePrice,
    change: change,
    changePercent: changePercent,
    lastUpdate: new Date().toISOString(),
    currency: "USD",
  };
}

// Fallback sparkline data
function getFallbackSparklineData() {
  const data = [];
  const basePrice = 150;
  for (let i = 6; i >= 0; i--) {
    data.push(basePrice + (Math.random() - 0.5) * 20);
  }
  return data;
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

// Format percentage with proper validation
function formatPercentage(percent) {
  if (isNaN(percent) || percent === null || percent === undefined) {
    return "0.00%";
  }

  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

// Create sparkline SVG
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

// Create widget HTML
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
    // Show loading
    this.container.innerHTML =
      '<div style="padding: 40px; text-align: center;">📡 Fetching real data...</div>';

    try {
      // Get real stock data
      const stockData = await getRealStockData(this.symbol);
      const sparklineData = this.showSparkline
        ? await getRealSparklineData(this.symbol)
        : [];

      // Create widget HTML
      const widgetHTML = createWidgetHTML(
        stockData,
        sparklineData,
        this.isFloating
      );
      this.container.innerHTML = widgetHTML;

      // Add click handler
      if (this.onClick) {
        this.container.style.cursor = "pointer";
        this.container.onclick = () => this.onClick(this.symbol);
      }

      console.log("✅ Widget rendered successfully:", stockData);
    } catch (error) {
      console.error("❌ Error rendering widget:", error);
      this.container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          Error loading widget: ${error.message}
        </div>
      `;
    }
  }

  refresh() {
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
