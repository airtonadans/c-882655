import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReplayModeControlsProps {
  onStartReplay: (date: string, timeframe: string, speed: number) => void;
  onPauseReplay: () => void;
  onStopReplay: () => void;
  onResetReplay: () => void;
  onSpeedChange: (speed: number) => void;
  onJumpToPosition: (position: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentSpeed: number;
  progress: number;
  totalCandles: number;
  currentIndex: number;
}

const ReplayModeControls: React.FC<ReplayModeControlsProps> = ({
  onStartReplay,
  onPauseReplay,
  onStopReplay,
  onResetReplay,
  onSpeedChange,
  onJumpToPosition,
  isPlaying,
  isPaused,
  currentSpeed,
  progress,
  totalCandles,
  currentIndex
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateInput, setDateInput] = useState('');
  const [timeframe, setTimeframe] = useState('5min');
  const [speed, setSpeed] = useState(currentSpeed);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const timeframes = [
    { value: '1min', label: '1 Minuto' },
    { value: '5min', label: '5 Minutos' },
    { value: '15min', label: '15 Minutos' },
    { value: '1h', label: '1 Hora' }
  ];

  const handleStartReplay = () => {
    const dateToUse = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : dateInput;
    if (!dateToUse) {
      alert('Por favor, selecione uma data para o replay');
      return;
    }
    onStartReplay(dateToUse, timeframe, speed);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateInput(format(date, 'yyyy-MM-dd'));
      setIsCalendarOpen(false);
    }
  };

  const handleDateInputChange = (value: string) => {
    setDateInput(value);
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    } catch (error) {
      // Ignore invalid dates while typing
    }
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    const speedValue = newSpeed[0];
    setSpeed(speedValue);
    onSpeedChange(speedValue);
  };

  const handlePositionChange = (position: number[]) => {
    onJumpToPosition(position[0]);
  };

  return (
    <Card className="p-4 bg-gray-900 border-gray-700 text-white">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">
            Modo Replay
          </h3>
          
          <Badge 
            variant={isPlaying && !isPaused ? "default" : "secondary"}
            className={`text-xs ${isPlaying && !isPaused ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {isPlaying && !isPaused ? 'Executando' : isPaused ? 'Pausado' : 'Parado'}
          </Badge>
        </div>

        {/* Seleção de Data */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">
            Data do Replay
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => handleDateInputChange(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="yyyy-mm-dd"
              />
            </div>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 border-gray-600 bg-gray-800 hover:bg-gray-700"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className={cn("p-3 pointer-events-auto bg-gray-800 text-white")}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Seleção de Timeframe */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">
            Timeframe
          </Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Controle de Velocidade */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs font-medium text-gray-300">
            <Clock className="w-3 h-3" />
            Velocidade: {speed}x
          </Label>
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

        {/* Controle de Posição (Timeline) */}
        {totalCandles > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">
              Posição no Replay
            </Label>
            <Slider
              value={[currentIndex]}
              min={0}
              max={totalCandles - 1}
              step={1}
              onValueChange={handlePositionChange}
              className="w-full [&>span[role=slider]]:bg-blue-500 [&>span[role=slider]]:border-blue-400 [&>[data-orientation=horizontal]]:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Início</span>
              <span>Atual: {currentIndex + 1} / {totalCandles}</span>
              <span>Fim</span>
            </div>
          </div>
        )}

        {/* Controles de Reprodução */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={handleStartReplay}
            disabled={isPlaying && !isPaused}
            className="col-span-2 h-10 bg-green-600 hover:bg-green-700 text-white font-medium text-sm"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            {isPlaying && !isPaused ? 'Executando' : 'Iniciar Replay'}
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
      </div>
    </Card>
  );
};

export default ReplayModeControls;
