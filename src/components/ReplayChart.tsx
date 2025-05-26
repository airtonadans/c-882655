
import React, { useEffect, useRef, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { CandleData } from '../hooks/useReplayMode';
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar } from 'recharts';

interface ReplayChartProps {
  data: CandleData[];
  currentIndex: number;
  onJumpToPosition: (position: number) => void;
  speed: number;
}

interface CandleBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: any;
}

const CandleBar: React.FC<CandleBarProps> = ({ x = 0, y = 0, width = 0, height = 0, payload }) => {
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#22c55e' : '#ef4444';
  
  // Calcular posições dos preços
  const maxPrice = Math.max(high, low, open, close);
  const minPrice = Math.min(high, low, open, close);
  const priceRange = maxPrice - minPrice || 1;
  
  // Altura da vela (corpo)
  const bodyHeight = Math.abs(close - open) / priceRange * height;
  const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange * height);
  
  // Posições das mechas
  const wickTop = y + ((maxPrice - high) / priceRange * height);
  const wickBottom = y + ((maxPrice - low) / priceRange * height);
  
  const wickX = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 2);
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
        strokeWidth={1}
      />
      
      {/* Corpo da vela */}
      <rect
        x={bodyX}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight || 1}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Mecha inferior */}
      <line
        x1={wickX}
        y1={bodyTop + bodyHeight}
        x2={wickX}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const ReplayChart: React.FC<ReplayChartProps> = ({ 
  data, 
  currentIndex, 
  onJumpToPosition,
  speed 
}) => {
  const [previewTime, setPreviewTime] = useState<string>('');
  
  // Dados visíveis até o currentIndex
  const visibleData = data.slice(0, currentIndex).map((candle, index) => ({
    ...candle,
    index,
    dateTime: new Date(candle.time * 1000).toLocaleString()
  }));

  const currentCandle = currentIndex > 0 ? data[currentIndex - 1] : null;
  const progress = data.length > 0 ? (currentIndex / data.length) * 100 : 0;

  const chartConfig = {
    open: {
      label: "Abertura",
      color: "#8884d8",
    },
    close: {
      label: "Fechamento", 
      color: "#82ca9d",
    },
    high: {
      label: "Máxima",
      color: "#ffc658",
    },
    low: {
      label: "Mínima",
      color: "#ff7300",
    },
  };

  return (
    <div className="space-y-4">
      {/* Gráfico de Candles */}
      <Card className="p-4">
        <div className="h-[400px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visibleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="index"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => {
                    const item = visibleData[value];
                    return item ? new Date(item.time * 1000).toLocaleDateString() : '';
                  }}
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <ChartTooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{data.dateTime}</p>
                          <p>Abertura: <span className="font-mono">${data.open.toFixed(2)}</span></p>
                          <p>Máxima: <span className="font-mono">${data.high.toFixed(2)}</span></p>
                          <p>Mínima: <span className="font-mono">${data.low.toFixed(2)}</span></p>
                          <p>Fechamento: <span className="font-mono">${data.close.toFixed(2)}</span></p>
                        </div>
                      </ChartTooltipContent>
                    );
                  }}
                />
                <Bar 
                  dataKey="open" 
                  shape={<CandleBar />}
                  fillOpacity={0}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Overlay com informações do candle atual */}
        {currentCandle && (
          <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <h4 className="text-xs font-semibold mb-2">Candle Atual</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Data/Hora:</span>
              <span className="font-mono text-xs">
                {new Date(currentCandle.time * 1000).toLocaleString()}
              </span>
              
              <span className="text-muted-foreground">Abertura:</span>
              <span className="font-mono">${currentCandle.open.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Máxima:</span>
              <span className="font-mono">${currentCandle.high.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Mínima:</span>
              <span className="font-mono">${currentCandle.low.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Fechamento:</span>
              <span className="font-mono">${currentCandle.close.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Controles de Timeline */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progresso do Replay</span>
              <span className="font-mono">
                {currentIndex} / {data.length} candles ({progress.toFixed(1)}%)
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Timeline interativo */}
          {data.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Timeline</span>
                <span className="font-mono text-xs">Velocidade: {speed}x</span>
              </div>
              
              <Slider
                value={[currentIndex]}
                min={0}
                max={data.length}
                step={1}
                onValueChange={(value) => {
                  const previewIndex = value[0];
                  const previewCandle = data[previewIndex];
                  if (previewCandle) {
                    setPreviewTime(new Date(previewCandle.time * 1000).toLocaleString());
                  }
                }}
                onValueCommit={(value) => {
                  onJumpToPosition(value[0]);
                  setPreviewTime('');
                }}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {data[0] ? new Date(data[0].time * 1000).toLocaleDateString() : '-'}
                </span>
                {previewTime && (
                  <span className="bg-primary/20 px-2 py-1 rounded text-primary">
                    {previewTime}
                  </span>
                )}
                <span>
                  {data[data.length - 1] 
                    ? new Date(data[data.length - 1].time * 1000).toLocaleDateString() 
                    : '-'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReplayChart;
