
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Bar } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { CandleData } from '../utils/advancedMarketGenerator';

interface ProfessionalCandleChartProps {
  data: CandleData[];
  currentIndex: number;
  currentCandle: CandleData | null;
  isActive: boolean;
}

// Componente customizado para renderizar candles flutuantes
const FloatingCandleBar = (props: any) => {
  const { payload, x, y, width, height } = props;
  
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isBullish = close >= open;
  const color = isBullish ? '#0ECB81' : '#F6465D';
  
  // Calcular as posições dos preços no espaço do gráfico
  const priceRange = high - low;
  if (priceRange === 0) return null;
  
  const candleWidth = Math.max(width * 0.6, 3);
  const centerX = x + width / 2;
  
  // Calcular as posições Y baseadas nos valores reais dos preços
  // O Y vem do Recharts já mapeado para a altura correta
  const highY = y;
  const lowY = y + height;
  
  // Calcular posições do corpo baseadas no open/close
  const openRatio = (high - open) / priceRange;
  const closeRatio = (high - close) / priceRange;
  
  const openY = y + (openRatio * height);
  const closeY = y + (closeRatio * height);
  
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.abs(bodyBottom - bodyTop);
  
  return (
    <g>
      {/* Mecha superior (da máxima até o topo do corpo) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={bodyTop}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Corpo do candle */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={Math.max(bodyHeight, 1)}
        fill={isBullish ? color : 'transparent'}
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* Mecha inferior (da base do corpo até a mínima) */}
      <line
        x1={centerX}
        y1={bodyBottom}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload as CandleData;
  const change = data.close - data.open;
  const changePercent = (change / data.open) * 100;
  const isBullish = change >= 0;
  
  return (
    <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-white">
      <div className="space-y-2">
        <p className="font-medium text-gray-300 text-xs">
          {new Date(data.time * 1000).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Abertura</p>
            <p className="font-mono font-semibold text-white">${data.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Fechamento</p>
            <p className={`font-mono font-semibold ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
              ${data.close.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Máxima</p>
            <p className="font-mono font-semibold text-gray-300">${data.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Mínima</p>
            <p className="font-mono font-semibold text-gray-300">${data.low.toFixed(2)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className={`text-xs font-medium ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
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
      const dataToShow = data.slice(0, currentIndex + 1);
      setVisibleData(dataToShow.map((item, index) => ({ ...item, index })));
    }
  }, [data, currentIndex]);

  const getCurrentTrend = () => {
    if (!currentCandle) return null;
    
    const change = currentCandle.close - currentCandle.open;
    if (change > 0) return 'bullish';
    if (change < 0) return 'bearish';
    return 'neutral';
  };

  const trend = getCurrentTrend();

  // Calcular domain do Y baseado nos dados visíveis com margem
  const yDomain = visibleData.length > 0 
    ? [
        Math.min(...visibleData.map(d => d.low)) * 0.995,
        Math.max(...visibleData.map(d => d.high)) * 1.005
      ]
    : [0, 100];

  return (
    <Card className="p-3 bg-gray-900 border-gray-700">
      {/* Header compacto para mobile */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500 rounded-md">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              BTCUSDT
            </h3>
            <p className="text-xs text-gray-400">
              Simulação de Mercado
            </p>
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-1">
            {trend === 'bullish' && (
              <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Alta
              </Badge>
            )}
            {trend === 'bearish' && (
              <Badge className="bg-red-600 text-white text-xs px-2 py-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                Baixa
              </Badge>
            )}
            {trend === 'neutral' && (
              <Badge className="bg-gray-600 text-white text-xs px-2 py-1">
                <Minus className="w-3 h-3 mr-1" />
                Lateral
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Informações do candle atual - Layout mobile */}
      {currentCandle && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Abertura</p>
              <p className="font-mono font-semibold text-white">
                ${currentCandle.open.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Máxima</p>
              <p className="font-mono font-semibold text-green-400">
                ${currentCandle.high.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Mínima</p>
              <p className="font-mono font-semibold text-red-400">
                ${currentCandle.low.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Fechamento</p>
              <p className={`font-mono font-semibold ${
                currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'
              }`}>
                ${currentCandle.close.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Volume</p>
              <p className="font-mono font-semibold text-yellow-400">
                {(currentCandle.volume / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico otimizado para mobile */}
      <div className="h-[400px] w-full">
        {visibleData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={visibleData} 
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="1 1" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="index"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={(value) => {
                  const item = visibleData[value];
                  return item ? new Date(item.time * 1000).toLocaleDateString('pt-BR') : '';
                }}
              />
              <YAxis 
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Bar que carrega os dados para o candlestick customizado */}
              <Bar 
                dataKey="high"
                shape={<FloatingCandleBar />}
                fill="transparent"
                stroke="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Aguardando simulação...
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Configure as datas e inicie
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalCandleChart;
