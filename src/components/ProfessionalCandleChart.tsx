
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { CandleData } from '../utils/marketDataGenerator';

interface ProfessionalCandleChartProps {
  data: CandleData[];
  currentIndex: number;
  currentCandle: CandleData | null;
  isActive: boolean;
}

interface CandleBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleData;
}

const CandleBar: React.FC<CandleBarProps> = ({ x = 0, y = 0, width = 0, height = 0, payload }) => {
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isBullish = close > open;
  const color = isBullish ? '#10b981' : '#ef4444';
  
  // Calcular dimensões da vela
  const maxPrice = Math.max(high, low, open, close);
  const minPrice = Math.min(high, low, open, close);
  const priceRange = maxPrice - minPrice || 0.01;
  
  // Corpo da vela
  const bodyHeight = Math.abs(close - open) / priceRange * height;
  const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange * height);
  
  // Mechas
  const wickTop = y + ((maxPrice - high) / priceRange * height);
  const wickBottom = y + ((maxPrice - low) / priceRange * height);
  
  const wickX = x + width / 2;
  const bodyWidth = Math.max(width * 0.7, 2);
  const bodyX = x + (width - bodyWidth) / 2;

  return (
    <g>
      {/* Mecha superior */}
      <line
        x1={wickX}
        y1={wickTop}
        x2={wickX}
        y2={bodyTop}
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* Corpo da vela */}
      <rect
        x={bodyX}
        y={bodyTop}
        width={bodyWidth}
        height={Math.max(bodyHeight, 1)}
        fill={isBullish ? color : 'transparent'}
        stroke={color}
        strokeWidth={1.5}
        rx={1}
      />
      
      {/* Mecha inferior */}
      <line
        x1={wickX}
        y1={bodyTop + bodyHeight}
        x2={wickX}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload as CandleData;
  const change = data.close - data.open;
  const changePercent = (change / data.open) * 100;
  
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="space-y-2">
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {new Date(data.time * 1000).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600 dark:text-slate-400">Abertura</p>
            <p className="font-mono font-semibold">${data.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Fechamento</p>
            <p className={`font-mono font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.close.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Máxima</p>
            <p className="font-mono font-semibold">${data.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Mínima</p>
            <p className="font-mono font-semibold">${data.low.toFixed(2)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
          <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}${change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfessionalCandleChart: React.FC<ProfessionalCandleChartProps> = ({ 
  data, 
  currentIndex, 
  currentCandle,
  isActive 
}) => {
  const [visibleData, setVisibleData] = useState<CandleData[]>([]);

  useEffect(() => {
    if (data.length > 0 && currentIndex >= 0) {
      setVisibleData(data.slice(0, currentIndex + 1));
    }
  }, [data, currentIndex]);

  const formatXAxisLabel = (tickItem: number) => {
    if (visibleData[tickItem]) {
      return new Date(visibleData[tickItem].time * 1000).toLocaleDateString();
    }
    return '';
  };

  const getCurrentTrend = () => {
    if (!currentCandle) return null;
    
    const change = currentCandle.close - currentCandle.open;
    if (change > 0) return 'bullish';
    if (change < 0) return 'bearish';
    return 'neutral';
  };

  const trend = getCurrentTrend();

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      {/* Header do gráfico */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              BTCUSDT Simulação
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gráfico de Candles Sintético
            </p>
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-2">
            {trend === 'bullish' && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Alta
              </Badge>
            )}
            {trend === 'bearish' && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <TrendingDown className="w-3 h-3 mr-1" />
                Baixa
              </Badge>
            )}
            {trend === 'neutral' && (
              <Badge variant="secondary">
                Lateral
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Informações do candle atual */}
      {currentCandle && (
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Abertura</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                ${currentCandle.open.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Máxima</p>
              <p className="font-mono font-semibold text-green-600">
                ${currentCandle.high.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Mínima</p>
              <p className="font-mono font-semibold text-red-600">
                ${currentCandle.low.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Fechamento</p>
              <p className={`font-mono font-semibold ${
                currentCandle.close >= currentCandle.open ? 'text-green-600' : 'text-red-600'
              }`}>
                ${currentCandle.close.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Volume</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {(currentCandle.volume / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="h-[500px] w-full">
        {visibleData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={visibleData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                className="dark:stroke-slate-600"
              />
              <XAxis 
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => new Date(value * 1000).toLocaleDateString()}
              />
              <YAxis 
                domain={['dataMin - 500', 'dataMax + 500']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ComposedChart>
                {visibleData.map((entry, index) => (
                  <Cell key={index}>
                    <CandleBar payload={entry} />
                  </Cell>
                ))}
              </ComposedChart>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Aguardando dados do simulador...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Configure as datas e clique em "Iniciar Simulação"
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalCandleChart;
