
import React, { useEffect, useRef } from 'react';
import { Trade } from './CryptoStrategySimulator';

interface TradingChartProps {
  symbol: string;
  interval: string;
  trades: Trade[];
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, interval, trades }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpar o container antes de criar novo widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "br",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: true,
      save_image: false,
      container_id: "tradingview_chart",
      studies: [
        "STD;DEMA",
        "STD;ATR"
      ],
      overrides: {
        "paneProperties.background": "#0c0a09",
        "paneProperties.vertGridProperties.color": "#262626",
        "paneProperties.horzGridProperties.color": "#262626",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#d4d4d8"
      }
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="h-[500px] md:h-[600px] w-full rounded-lg border border-border bg-card"
        id="tradingview_chart"
      />
      
      {/* Overlay para mostrar trades simulados */}
      {trades.length > 0 && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
          <h3 className="text-sm font-semibold mb-2">Trades Simulados</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {trades.slice(-5).map((trade) => (
              <div key={trade.id} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="capitalize">{trade.type}</span>
                <span>${trade.price.toLocaleString()}</span>
                {trade.profit && (
                  <span className={`font-medium ${
                    trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trade.profit > 0 ? '+' : ''}${trade.profit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
