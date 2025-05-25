
import React, { useEffect, useRef } from 'react';
import { Trade } from './CryptoStrategySimulator';
import { CandleData } from '../hooks/useReplayMode';

interface TradingChartProps {
  symbol: string;
  interval: string;
  trades: Trade[];
  replayMode?: boolean;
  onCandleUpdate?: (callback: (candle: CandleData) => void) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  symbol, 
  interval, 
  trades, 
  replayMode = false,
  onCandleUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpar o container antes de criar novo widget
    containerRef.current.innerHTML = '';

    if (replayMode) {
      // Criar widget especial para modo replay
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
        container_id: "tradingview_chart_replay",
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

      // Configurar callback para replay
      if (onCandleUpdate) {
        onCandleUpdate((candle: CandleData) => {
          console.log('Atualizando candle no gráfico:', candle);
          // Aqui seria a integração real com o gráfico para adicionar candles progressivamente
        });
      }
    } else {
      // Widget normal para modo estratégia
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
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, replayMode, onCandleUpdate]);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="h-[500px] md:h-[600px] w-full rounded-lg border border-border bg-card"
        id={replayMode ? "tradingview_chart_replay" : "tradingview_chart"}
      />
      
      {/* Overlay para modo replay */}
      {replayMode && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">Modo Replay</span>
          </div>
        </div>
      )}
      
      {/* Overlay para mostrar trades simulados - apenas no modo estratégia */}
      {!replayMode && trades.length > 0 && (
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
