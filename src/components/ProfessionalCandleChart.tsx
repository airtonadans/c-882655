
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Bar } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { CandleData } from '../utils/advancedMarketGenerator';
import CustomTooltip from './CustomTooltip';

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
  
  const candleWidth = Math.max(width * 0.6, 3);
  const centerX = x + width / 2;
  
  // Calcular as posições Y baseadas na escala do gráfico
  // O Recharts mapeia automaticamente os valores para as coordenadas Y
  const priceRange = high - low;
  if (priceRange === 0) {
    // Se não há variação de preço, renderizar apenas uma linha horizontal
    return (
      <g>
        <rect
          x={centerX - candleWidth / 2}
          y={y}
          width={candleWidth}
          height={1}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  }
  
  // Calcular as posições Y do corpo do candle
  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodyHeight = Math.abs(close - open);
  
  // Mapear os preços para coordenadas Y do gráfico
  // A coordenada Y cresce de cima para baixo, então invertemos a lógica
  const yScale = height / priceRange;
  
  const highY = y;
  const lowY = y + height;
  const bodyTopY = y + ((high - bodyTop) / priceRange) * height;
  const bodyBottomY = y + ((high - bodyBottom) / priceRange) * height;
  const bodyHeightPixels = Math.abs(bodyBottomY - bodyTopY);

  return (
    <g>
      {/* Mecha superior (da máxima até o topo do corpo) */}
      {high > bodyTop && (
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={bodyTopY}
          stroke={color}
          strokeWidth={1}
        />
      )}
      
      {/* Corpo do candle */}
      <rect
        x={centerX - candleWidth / 2}
        y={Math.min(bodyTopY, bodyBottomY)}
        width={candleWidth}
        height={Math.max(bodyHeightPixels, 1)}
        fill={isBullish ? color : 'transparent'}
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* Mecha inferior (da base do corpo até a mínima) */}
      {low < bodyBottom && (
        <line
          x1={centerX}
          y1={Math.max(bodyTopY, bodyBottomY)}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
      )}
    </g>
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

  // Calcular domain do Y com padding de 10% em cima e embaixo
  const yDomain = visibleData.length > 0 
    ? (() => {
        const minPrice = Math.min(...visibleData.map(d => d.low));
        const maxPrice = Math.max(...visibleData.map(d => d.high));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1; // 10% de padding
        
        return [
          Math.max(0, minPrice - padding), // Não deixar ir abaixo de 0
          maxPrice + padding
        ];
      })()
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
