
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { CandleData } from '../utils/advancedMarketGenerator';
import EChartsCandle from './EChartsCandle';

interface ProfessionalCandleChartProps {
  data: CandleData[];
  currentIndex: number;
  currentCandle: CandleData | null;
  isActive: boolean;
}

const ProfessionalCandleChart: React.FC<ProfessionalCandleChartProps> = ({ 
  data, 
  currentIndex, 
  currentCandle,
  isActive 
}) => {
  // Debug logs
  useEffect(() => {
    console.log('ProfessionalCandleChart - Data received:', {
      dataLength: data.length,
      currentIndex,
      firstItem: data[0],
      lastItem: data[data.length - 1],
      currentCandle
    });
  }, [data, currentIndex, currentCandle]);

  const getCurrentTrend = () => {
    if (!currentCandle) return null;
    const change = currentCandle.close - currentCandle.open;
    if (change > 0) return 'bullish';
    if (change < 0) return 'bearish';
    return 'neutral';
  };

  const trend = getCurrentTrend();

  return (
    <Card className="p-3 bg-gray-900 border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500 rounded-md">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              XAUUSD
            </h3>
            <p className="text-xs text-gray-400">
              Ouro / Dólar Americano
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

      {currentCandle && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Abertura</p>
              <p className="font-mono font-semibold text-white">
                ${currentCandle.open?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Máxima</p>
              <p className="font-mono font-semibold text-green-400">
                ${currentCandle.high?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Mínima</p>
              <p className="font-mono font-semibold text-red-400">
                ${currentCandle.low?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Fechamento</p>
              <p className={`font-mono font-semibold ${
                currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'
              }`}>
                ${currentCandle.close?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Volume</p>
              <p className="font-mono font-semibold text-yellow-400">
                {currentCandle.volume ? (currentCandle.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-center text-gray-400">
            {currentCandle.time ? new Date(currentCandle.time * 1000).toLocaleString('pt-BR') : 'N/A'}
          </div>
        </div>
      )}

      <div className="h-[400px] w-full">
        {data.length > 0 ? (
          <EChartsCandle 
            data={data}
            currentIndex={currentIndex}
            currentCandle={currentCandle}
            isActive={isActive}
            height="400px"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Aguardando dados...
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Carregue dados ou inicie replay
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalCandleChart;
