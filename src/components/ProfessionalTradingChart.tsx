
import React from 'react';
import TradingViewChart from './TradingViewChart';
import { CandleData } from '../utils/advancedMarketGenerator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProfessionalTradingChartProps {
  data: CandleData[];
  currentIndex?: number;
  currentCandle?: CandleData | null;
  isActive?: boolean;
}

const ProfessionalTradingChart: React.FC<ProfessionalTradingChartProps> = ({
  data,
  currentIndex,
  currentCandle,
  isActive
}) => {
  const getTrend = () => {
    if (!data.length || currentIndex < 1) return 'neutral';
    
    const visibleData = currentIndex >= 0 ? data.slice(0, currentIndex + 1) : data;
    if (visibleData.length < 2) return 'neutral';
    
    const recent = visibleData.slice(-5);
    const upCandles = recent.filter(c => c.close > c.open).length;
    const downCandles = recent.filter(c => c.close < c.open).length;
    
    if (upCandles > downCandles) return 'bullish';
    if (downCandles > upCandles) return 'bearish';
    return 'neutral';
  };

  const trend = getTrend();

  return (
    <Card className="p-0 bg-gray-950 border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">XAUUSD</h3>
            <Badge 
              variant="secondary" 
              className={`${
                trend === 'bullish' ? 'bg-green-600 text-white' :
                trend === 'bearish' ? 'bg-red-600 text-white' :
                'bg-gray-600 text-gray-200'
              }`}
            >
              {trend === 'bullish' && <TrendingUp className="w-3 h-3 mr-1" />}
              {trend === 'bearish' && <TrendingDown className="w-3 h-3 mr-1" />}
              {trend === 'bullish' ? 'Bullish' : trend === 'bearish' ? 'Bearish' : 'Neutral'}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-400">
            {currentIndex >= 0 ? (
              `${currentIndex + 1} / ${data.length} candles`
            ) : (
              `${data.length} candles`
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-950">
        <TradingViewChart
          data={data}
          currentIndex={currentIndex}
          currentCandle={currentCandle}
          isActive={isActive}
          height="500px"
        />
      </div>
    </Card>
  );
};

export default ProfessionalTradingChart;
