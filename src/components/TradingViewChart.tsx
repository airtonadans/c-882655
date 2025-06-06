import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { CandleData } from '../utils/advancedMarketGenerator';

interface TradingViewChartProps {
  data: CandleData[];
  currentIndex?: number;
  currentCandle?: CandleData | null;
  isActive?: boolean;
  height?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data, 
  currentIndex = -1, 
  currentCandle,
  isActive = false,
  height = '400px'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || isInitialized) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: parseInt(height),
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Use type assertion to fix TypeScript issue with lightweight-charts
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsInitialized(false);
    };
  }, [height, isInitialized]);

  // Update data
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !data.length) return;

    console.log('TradingView - Updating chart with data:', {
      totalData: data.length,
      currentIndex,
      sample: data.slice(0, 3).map(d => ({
        time: d.time,
        date: new Date(d.time * 1000).toISOString(),
        ohlc: [d.open, d.high, d.low, d.close]
      }))
    });

    // Determine visible data based on current index (for replay mode)
    let visibleData = data;
    if (currentIndex >= 0) {
      visibleData = data.slice(0, currentIndex + 1);
    }

    // Convert to TradingView format
    const chartData: CandlestickData[] = visibleData
      .filter(candle => {
        // Basic validation
        return candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0 &&
               candle.high >= Math.max(candle.open, candle.close) &&
               candle.low <= Math.min(candle.open, candle.close);
      })
      .map(candle => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    console.log('TradingView - Setting chart data:', {
      originalLength: visibleData.length,
      validLength: chartData.length,
      firstCandle: chartData[0],
      lastCandle: chartData[chartData.length - 1]
    });

    if (chartData.length > 0) {
      candlestickSeriesRef.current.setData(chartData);
      
      // Auto-fit content
      chartRef.current.timeScale().fitContent();
    }
  }, [data, currentIndex]);

  return (
    <div className="relative w-full">
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height }}
      />
      
      {/* Current candle overlay */}
      {currentCandle && isActive && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <h4 className="text-xs font-semibold mb-2 text-white">Candle Atual</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-gray-400">Tempo:</span>
            <span className="font-mono text-xs text-white">
              {new Date(currentCandle.time * 1000).toLocaleString()}
            </span>
            
            <span className="text-gray-400">Open:</span>
            <span className="font-mono text-white">${currentCandle.open.toFixed(2)}</span>
            
            <span className="text-gray-400">High:</span>
            <span className="font-mono text-green-400">${currentCandle.high.toFixed(2)}</span>
            
            <span className="text-gray-400">Low:</span>
            <span className="font-mono text-red-400">${currentCandle.low.toFixed(2)}</span>
            
            <span className="text-gray-400">Close:</span>
            <span className={`font-mono ${currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'}`}>
              ${currentCandle.close.toFixed(2)}
            </span>
            
            <span className="text-gray-400">Volume:</span>
            <span className="font-mono text-white">
              {currentCandle.volume ? (currentCandle.volume / 1000000).toFixed(2) + 'M' : '0.00M'}
            </span>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="text-white">Carregando gráfico...</div>
        </div>
      )}
      
      {/* No data state */}
      {isInitialized && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">Nenhum dado disponível</div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
