
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import EChartsCandle from './EChartsCandle';
import { CandleData } from '../utils/advancedMarketGenerator';

const CryptoChart = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate sample Bitcoin data for demonstration
  useEffect(() => {
    const generateSampleBitcoinData = () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const basePrice = 45000; // Base Bitcoin price
      const sampleData: CandleData[] = [];

      for (let i = 30; i >= 0; i--) {
        const time = Math.floor((now - (i * oneDay)) / 1000);
        const randomFactor = 0.95 + Math.random() * 0.1; // ±5% variation
        const price = basePrice * randomFactor;
        const variation = price * 0.02; // 2% daily variation
        
        const open = price + (Math.random() - 0.5) * variation;
        const close = price + (Math.random() - 0.5) * variation;
        const high = Math.max(open, close) + Math.random() * variation * 0.5;
        const low = Math.min(open, close) - Math.random() * variation * 0.5;
        const volume = 1000000 + Math.random() * 5000000;

        sampleData.push({
          time,
          open,
          high,
          low,
          close,
          volume
        });
      }

      return sampleData.sort((a, b) => a.time - b.time);
    };

    // Simulate loading delay
    setTimeout(() => {
      setData(generateSampleBitcoinData());
      setIsLoading(false);
    }, 1000);
  }, []);

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const previousPrice = data.length > 1 ? data[data.length - 2].close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Bitcoin Price</h2>
            <p className="text-sm text-gray-400">BTC/USDT</p>
          </div>
        </div>
        
        {!isLoading && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="h-[400px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
              <p className="text-gray-400 text-sm">Loading Bitcoin data...</p>
            </div>
          </div>
        ) : (
          <EChartsCandle 
            data={data}
            currentIndex={data.length - 1}
            currentCandle={data[data.length - 1]}
            isActive={true}
            height="400px"
          />
        )}
      </div>

      {!isLoading && (
        <div className="mt-4 flex justify-center">
          <Badge className="bg-gray-700 text-gray-300">
            Sample Data - {data.length} days
          </Badge>
        </div>
      )}
    </div>
  );
};

export default CryptoChart;
