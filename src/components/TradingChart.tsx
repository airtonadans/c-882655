
import React from 'react';
import { Trade } from './CryptoStrategySimulator';
import { CandleData } from '../hooks/useReplayMode';
import EChartsCandle from './EChartsCandle';

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
  // Mock data for demonstration
  const mockData: CandleData[] = [
    { time: Date.now() / 1000 - 86400 * 30, open: 2000, high: 2100, low: 1950, close: 2050, volume: 1000000 },
    { time: Date.now() / 1000 - 86400 * 29, open: 2050, high: 2150, low: 2000, close: 2100, volume: 1200000 },
    { time: Date.now() / 1000 - 86400 * 28, open: 2100, high: 2200, low: 2050, close: 2180, volume: 980000 },
  ];

  return (
    <div className="relative">
      <div className="h-[500px] md:h-[600px] w-full rounded-lg border border-border bg-card">
        <EChartsCandle 
          data={mockData}
          currentIndex={mockData.length - 1}
          currentCandle={mockData[mockData.length - 1]}
          isActive={true}
          height="100%"
        />
      </div>
      
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
