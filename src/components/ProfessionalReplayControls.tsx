
import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, TrendingUp, Shuffle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfessionalReplayControlsProps {
  onStartReplay: (speed: number) => void;
  onPauseReplay: () => void;
  onStopReplay: () => void;
  onResetReplay: () => void;
  onSpeedChange: (speed: number) => void;
  onGenerateNewScenario: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentSpeed: number;
  progress: number;
  totalCandles: number;
  currentIndex: number;
  marketSentiment: string;
  marketPhase: string;
}

const ProfessionalReplayControls: React.FC<ProfessionalReplayControlsProps> = ({
  onStartReplay,
  onPauseReplay,
  onStopReplay,
  onResetReplay,
  onSpeedChange,
  onGenerateNewScenario,
  isPlaying,
  isPaused,
  currentSpeed,
  progress,
  totalCandles,
  currentIndex,
  marketSentiment,
  marketPhase
}) => {
  const [speed, setSpeed] = useState(currentSpeed);

  const handleStartReplay = () => {
    onStartReplay(speed);
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    const speedValue = newSpeed[0];
    setSpeed(speedValue);
    onSpeedChange(speedValue);
  };

  const getStatusColor = () => {
    if (isPlaying && !isPaused) return 'bg-green-500';
    if (isPaused) return 'bg-yellow-500';
    return 'bg-gray-600';
  };

  const getStatusText = () => {
    if (isPlaying && !isPaused) return 'Executando';
    if (isPaused) return 'Pausado';
    return 'Parado';
  };

  const getSentimentColor = () => {
    switch (marketSentiment) {
      case 'bullish': return 'bg-green-600 text-white';
      case 'bearish': return 'bg-red-600 text-white';
      case 'volatile': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSentimentText = () => {
    switch (marketSentiment) {
      case 'bullish': return 'Alta';
      case 'bearish': return 'Baixa';
      case 'volatile': return 'Volátil';
      default: return 'Lateral';
    }
  };

  const getPhaseText = () => {
    switch (marketPhase) {
      case 'opening': return 'Abertura';
      case 'morning_trend': return 'Manhã';
      case 'midday_consolidation': return 'Meio-dia';
      case 'afternoon_trend': return 'Tarde';
      case 'closing': return 'Fechamento';
      default: return 'Pregão';
    }
  };

  return (
    <Card className="p-4 bg-gray-900 border-gray-700 text-white">
      <div className="space-y-4">
        {/* Header com status compacto para mobile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500 rounded-md">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">
                Simulador Avançado
              </h3>
              <p className="text-xs text-gray-400">
                BTCUSDT Sintético
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <Badge 
              variant={isPlaying && !isPaused ? "default" : "secondary"}
              className={`text-xs ${isPlaying && !isPaused ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Informações do Mercado Sintético */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Sentimento</p>
            <Badge className={`text-xs ${getSentimentColor()}`}>
              {getSentimentText()}
            </Badge>
          </div>
          <div className="text-center p-2 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Fase</p>
            <Badge className="text-xs bg-blue-600 text-white">
              {getPhaseText()}
            </Badge>
          </div>
        </div>

        {/* Botão Novo Cenário */}
        <Button
          onClick={onGenerateNewScenario}
          className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium text-sm"
          size="sm"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Gerar Novo Cenário
        </Button>

        {/* Controle de Velocidade */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs font-medium text-gray-300">
            <Clock className="w-3 h-3" />
            Velocidade: {speed}x
          </Label>
          <div className="space-y-1">
            <Slider
              value={[speed]}
              min={1}
              max={20}
              step={1}
              onValueChange={handleSpeedChange}
              className="w-full [&>span[role=slider]]:bg-yellow-500 [&>span[role=slider]]:border-yellow-400 [&>[data-orientation=horizontal]]:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1x</span>
              <span>10x</span>
              <span>20x</span>
            </div>
          </div>
        </div>

        {/* Controles de Reprodução - Otimizado para mobile */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={handleStartReplay}
            disabled={isPlaying && !isPaused}
            className="col-span-2 h-10 bg-green-600 hover:bg-green-700 text-white font-medium text-sm"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            {isPlaying && !isPaused ? 'Executando' : 'Iniciar'}
          </Button>

          <Button
            onClick={onPauseReplay}
            disabled={!isPlaying}
            variant="outline"
            size="sm"
            className="h-10 border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Pause className="w-4 h-4" />
          </Button>

          <Button
            onClick={onStopReplay}
            disabled={!isPlaying}
            variant="outline"
            size="sm"
            className="h-10 border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={onResetReplay}
          variant="outline"
          size="sm"
          className="w-full h-9 border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>

        {/* Barra de Progresso */}
        {totalCandles > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Progresso</span>
              <span className="font-mono text-yellow-400">
                {currentIndex} / {totalCandles} ({progress.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Informações Técnicas */}
        {totalCandles > 0 && (
          <div className="text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center gap-1">
              <Activity className="w-3 h-3" />
              Pregão sintético • {totalCandles} candles • 5min cada
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalReplayControls;
