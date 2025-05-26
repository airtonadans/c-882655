
import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfessionalReplayControlsProps {
  onStartReplay: (startDate: string, endDate: string, speed: number) => void;
  onPauseReplay: () => void;
  onStopReplay: () => void;
  onResetReplay: () => void;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentSpeed: number;
  progress: number;
  totalCandles: number;
  currentIndex: number;
}

const ProfessionalReplayControls: React.FC<ProfessionalReplayControlsProps> = ({
  onStartReplay,
  onPauseReplay,
  onStopReplay,
  onResetReplay,
  onSpeedChange,
  isPlaying,
  isPaused,
  currentSpeed,
  progress,
  totalCandles,
  currentIndex
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

  const getStatusColor = () => {
    if (isPlaying && !isPaused) return 'bg-green-500';
    if (isPaused) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (isPlaying && !isPaused) return 'Executando';
    if (isPaused) return 'Pausado';
    return 'Parado';
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Simulador de Mercado
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Modo Replay Avançado
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <Badge variant={isPlaying && !isPaused ? "default" : "secondary"}>
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Configuração de Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Data de Início
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Data de Fim
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Controle de Velocidade */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Velocidade de Simulação: {speed}x
          </Label>
          <div className="space-y-2">
            <Slider
              value={[speed]}
              min={1}
              max={20}
              step={1}
              onValueChange={handleSpeedChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1x (Normal)</span>
              <span>5x</span>
              <span>10x</span>
              <span>20x (Rápido)</span>
            </div>
          </div>
        </div>

        {/* Controles de Reprodução */}
        <div className="flex gap-3">
          <Button
            onClick={handleStartReplay}
            disabled={isPlaying && !isPaused}
            className="flex-1 h-12"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {isPlaying && !isPaused ? 'Executando...' : 'Iniciar Simulação'}
          </Button>

          <Button
            onClick={onPauseReplay}
            disabled={!isPlaying}
            variant="outline"
            size="lg"
            className="h-12 px-6"
          >
            <Pause className="w-4 h-4" />
          </Button>

          <Button
            onClick={onStopReplay}
            disabled={!isPlaying}
            variant="outline"
            size="lg"
            className="h-12 px-6"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            onClick={onResetReplay}
            variant="outline"
            size="lg"
            className="h-12 px-6"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Barra de Progresso */}
        {totalCandles > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progresso da Simulação</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {currentIndex} / {totalCandles} candles ({progress.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalReplayControls;
