
import React, { useState } from 'react';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HistoryModeControlsProps {
  onLoadHistory: (startDate: string, endDate: string, timeframe: string) => void;
  isLoading: boolean;
  totalCandles: number;
}

const HistoryModeControls: React.FC<HistoryModeControlsProps> = ({
  onLoadHistory,
  isLoading,
  totalCandles
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [timeframe, setTimeframe] = useState('5min');
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const timeframes = [
    { value: '1min', label: '1 Minuto' },
    { value: '5min', label: '5 Minutos' },
    { value: '15min', label: '15 Minutos' },
    { value: '1h', label: '1 Hora' },
    { value: '1d', label: '1 Dia' }
  ];

  const handleLoadHistory = () => {
    const startDateToUse = startDate ? format(startDate, 'yyyy-MM-dd') : startDateInput;
    const endDateToUse = endDate ? format(endDate, 'yyyy-MM-dd') : endDateInput;
    
    if (!startDateToUse || !endDateToUse) {
      alert('Por favor, selecione as datas de início e fim');
      return;
    }

    if (new Date(startDateToUse) > new Date(endDateToUse)) {
      alert('A data de início deve ser anterior à data de fim');
      return;
    }

    onLoadHistory(startDateToUse, endDateToUse, timeframe);
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setStartDateInput(format(date, 'yyyy-MM-dd'));
      setIsStartCalendarOpen(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      setEndDateInput(format(date, 'yyyy-MM-dd'));
      setIsEndCalendarOpen(false);
    }
  };

  const handleStartDateInputChange = (value: string) => {
    setStartDateInput(value);
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
      }
    } catch (error) {
      // Ignore invalid dates while typing
    }
  };

  const handleEndDateInputChange = (value: string) => {
    setEndDateInput(value);
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setEndDate(date);
      }
    } catch (error) {
      // Ignore invalid dates while typing
    }
  };

  return (
    <Card className="p-4 bg-gray-900 border-gray-700 text-white">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">
            Modo Histórico
          </h3>
          
          {totalCandles > 0 && (
            <Badge className="text-xs bg-blue-600 text-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              {totalCandles} candles carregados
            </Badge>
          )}
        </div>

        {/* Período de Análise */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">
            Período de Análise
          </Label>
          
          {/* Data de Início */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Data de Início</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => handleStartDateInputChange(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="yyyy-mm-dd"
                />
              </div>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
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
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    className={cn("p-3 pointer-events-auto bg-gray-800 text-white")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data de Fim */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Data de Fim</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => handleEndDateInputChange(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="yyyy-mm-dd"
                />
              </div>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
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
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    className={cn("p-3 pointer-events-auto bg-gray-800 text-white")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
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

        {/* Botão Carregar */}
        <Button
          onClick={handleLoadHistory}
          disabled={isLoading}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Carregando Histórico...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Carregar Histórico
            </>
          )}
        </Button>

        {/* Informações */}
        <div className="text-xs text-gray-500 text-center">
          <p>O gráfico completo do período será carregado e exibido abaixo.</p>
          <p>Este modo não possui controles de replay.</p>
        </div>
      </div>
    </Card>
  );
};

export default HistoryModeControls;
