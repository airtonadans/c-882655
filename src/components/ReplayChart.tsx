
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { CandleData } from '../utils/advancedMarketGenerator';
import EChartsCandle from './EChartsCandle';

interface ReplayChartProps {
  data: CandleData[];
  currentIndex: number;
  onJumpToPosition: (position: number) => void;
  speed: number;
}

const ReplayChart: React.FC<ReplayChartProps> = ({ 
  data, 
  currentIndex, 
  onJumpToPosition,
  speed 
}) => {
  const [previewTime, setPreviewTime] = useState<string>('');
  
  const currentCandle = currentIndex > 0 ? data[currentIndex - 1] : null;
  const progress = data.length > 0 ? (currentIndex / data.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Gráfico de Candles */}
      <Card className="p-4 relative">
        <div className="h-[400px] w-full">
          <EChartsCandle 
            data={data}
            currentIndex={currentIndex}
            currentCandle={currentCandle}
            isActive={true}
            height="400px"
          />
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
              
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono">
                {currentCandle.volume ? (currentCandle.volume / 1000000).toFixed(2) + 'M' : '0.00M'}
              </span>
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
