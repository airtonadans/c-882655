
import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

interface ReplayControlsProps {
  onStartReplay: (startDate: string, endDate: string, speed: number) => void;
  onPauseReplay: () => void;
  onStopReplay: () => void;
  onResetReplay: () => void;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentSpeed: number;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  onStartReplay,
  onPauseReplay,
  onStopReplay,
  onResetReplay,
  onSpeedChange,
  isPlaying,
  isPaused,
  currentSpeed,
}) => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-31');
  const [speed, setSpeed] = useState(currentSpeed);

  const handleStartReplay = () => {
    if (!startDate || !endDate) return;
    onStartReplay(startDate, endDate, speed);
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    const speedValue = newSpeed[0];
    setSpeed(speedValue);
    onSpeedChange(speedValue);
  };

  const speedOptions = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
    { value: 20, label: '20x' },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground">Modo Replay</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data de Início */}
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-muted-foreground">
                Data Início
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 bg-background border-border"
              />
            </div>

            {/* Data de Fim */}
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-muted-foreground">
                Data Fim
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 bg-background border-border"
              />
            </div>

            {/* Velocidade com Slider */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Velocidade: {speed}x
              </Label>
              <div className="mt-1 space-y-2">
                <Slider
                  value={[speed]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={handleSpeedChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1x</span>
                  <span>10x</span>
                  <span>20x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Reprodução */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartReplay}
            disabled={isPlaying && !isPaused}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isPlaying && !isPaused ? 'Executando...' : 'Iniciar Replay'}
          </Button>

          <Button
            onClick={onPauseReplay}
            disabled={!isPlaying}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            {isPaused ? 'Continuar' : 'Pausar'}
          </Button>

          <Button
            onClick={onStopReplay}
            disabled={!isPlaying}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Parar
          </Button>

          <Button
            onClick={onResetReplay}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Status */}
        {isPlaying && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
            <span className="text-muted-foreground">
              Status: {isPaused ? 'Pausado' : `Reproduzindo ${currentSpeed}x`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReplayControls;
