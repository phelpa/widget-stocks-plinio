// Simple Stock Widget - No dependencies, just vanilla JS

// Demo data generator
function getDemoStockData(symbol = "AAPL") {
  const symbols = {
    AAPL: "Apple Inc.",
    MSFT: "Microsoft Corporation",
    GOOGL: "Alphabet Inc.",
    TSLA: "Tesla, Inc.",
    NVDA: "NVIDIA Corporation",
  };

  const basePrice = 150 + Math.random() * 100;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol: symbol.toUpperCase(),
    companyName: symbols[symbol.toUpperCase()] || `${symbol} Corporation`,
    currentPrice: basePrice,
    change: change,
    changePercent: changePercent,
    lastUpdate: new Date().toISOString(),
    currency: "USD",
  };
}

// Simple sparkline data
function getDemoSparklineData() {
  const data = [];
  const basePrice = 150;
  for (let i = 6; i >= 0; i--) {
    data.push(basePrice + (Math.random() - 0.5) * 20);
  }
  return data;
}

// Format price
function formatPrice(price, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
}

// Format percentage
function formatPercentage(percent) {
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

  render() {
    // Show loading
    this.container.innerHTML =
      '<div style="padding: 40px; text-align: center;">Loading...</div>';

    // Simulate loading delay
    setTimeout(() => {
      try {
        // Get demo data
        const stockData = getDemoStockData(this.symbol);
        const sparklineData = this.showSparkline ? getDemoSparklineData() : [];

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
    }, 500);
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
