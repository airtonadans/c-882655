
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Heart, Upload, ChevronsUpDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProfessionalCandleChart from './ProfessionalCandleChart'; // Importa o gráfico
import { AdvancedMarketGenerator, CandleData } from '../utils/advancedMarketGenerator'; // Importa o gerador e tipo
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Importa o Select
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog" // Importa o Dialog para configurações

const MAX_SESSIONS_DEFAULT = 5; // Limite inicial de pregões armazenados
const AVAILABLE_TIMEFRAMES = ['1min', '2min', '5min', '10min']; // Timeframes disponíveis
const DEFAULT_TIMEFRAME = '5min';

const TradingSimulator = () => {
  const [timeframe, setTimeframe] = useState<string>(DEFAULT_TIMEFRAME);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [contracts, setContracts] = useState('1');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [finalBalance, setFinalBalance] = useState('10000');

  // Estados para gerenciamento de pregões
  const [tradingSessions, setTradingSessions] = useState<Record<string, CandleData[][]>>({}); // Armazena por timeframe
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(0);
  const [maxSessions, setMaxSessions] = useState<number>(MAX_SESSIONS_DEFAULT);
  const [tempMaxSessions, setTempMaxSessions] = useState<string>(MAX_SESSIONS_DEFAULT.toString());
  const [currentCandleIndex, setCurrentCandleIndex] = useState<number>(-1);
  const [currentCandleData, setCurrentCandleData] = useState<CandleData | null>(null);

  const marketGenerator = useRef<AdvancedMarketGenerator | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);

  // Função para obter o array de sessões para o timeframe atual
  const getCurrentTimeframeSessions = useCallback(() => {
    return tradingSessions[timeframe] || [];
  }, [tradingSessions, timeframe]);

  // Função para gerar um novo pregão PARA TODOS os timeframes
  const generateAndAddNewSessionForAllTimeframes = useCallback(() => {
    if (!marketGenerator.current) {
      marketGenerator.current = new AdvancedMarketGenerator();
    } else {
      marketGenerator.current.generateNewScenario();
    }

    const newSessionsForAllTimeframes: Record<string, CandleData[][]> = {};

    // Gera dados para cada timeframe disponível
    AVAILABLE_TIMEFRAMES.forEach(tf => {
        const intervalMinutes = parseInt(tf.replace('min', ''), 10);
        const newSessionData = marketGenerator.current!.generateTradingSession(intervalMinutes);
        
        // Pega as sessões existentes para este timeframe ou inicializa
        const existingSessionsForTf = tradingSessions[tf] || [];
        let updatedSessionsForTf = [...existingSessionsForTf];

        // Aplica a lógica de limite cíclico
        if (updatedSessionsForTf.length >= maxSessions) {
            updatedSessionsForTf = [...updatedSessionsForTf.slice(1), newSessionData];
        } else {
            updatedSessionsForTf.push(newSessionData);
        }
        newSessionsForAllTimeframes[tf] = updatedSessionsForTf;
    });

    setTradingSessions(newSessionsForAllTimeframes);

    // Define o índice da nova sessão (será o mesmo para todos os timeframes)
    const currentSessionsForDefaultTf = newSessionsForAllTimeframes[DEFAULT_TIMEFRAME] || [];
    setCurrentSessionIndex(currentSessionsForDefaultTf.length - 1);
    resetSimulationState();

  }, [maxSessions, tradingSessions]);

  // Gera o primeiro pregão ao montar o componente
  useEffect(() => {
    // Verifica se já existe alguma sessão para o timeframe padrão
    if (!tradingSessions[DEFAULT_TIMEFRAME] || tradingSessions[DEFAULT_TIMEFRAME].length === 0) {
      generateAndAddNewSessionForAllTimeframes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reseta o estado da simulação
  const resetSimulationState = () => {
    setIsPlaying(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setCurrentCandleIndex(-1);
    setCurrentCandleData(null);
    setFinalBalance(initialBalance);
  };

  // Lógica da simulação
  const advanceSimulation = useCallback(() => {
    const currentSessions = getCurrentTimeframeSessions();
    if (!currentSessions[currentSessionIndex]) return;

    setCurrentCandleIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      const currentSession = currentSessions[currentSessionIndex];
      if (currentSession && nextIndex < currentSession.length) {
        setCurrentCandleData(currentSession[nextIndex]);
        return nextIndex;
      } else {
        setIsPlaying(false);
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
          simulationInterval.current = null;
        }
        return prevIndex;
      }
    });
  }, [getCurrentTimeframeSessions, currentSessionIndex]);

  // Controla o intervalo da simulação
  useEffect(() => {
    if (isPlaying) {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
      const speedMultiplier = parseInt(speed.replace('x', ''), 10);
      const intervalTime = 1000 / speedMultiplier;
      simulationInterval.current = setInterval(advanceSimulation, intervalTime);
    } else {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    }
    return () => { if (simulationInterval.current) clearInterval(simulationInterval.current); };
  }, [isPlaying, speed, advanceSimulation]);

  // Handlers
  const handlePlayPause = () => {
    const currentSessions = getCurrentTimeframeSessions();
    const currentSession = currentSessions[currentSessionIndex];
    if (currentSession && currentCandleIndex >= currentSession.length - 1) {
      resetSimulationState();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = resetSimulationState;
  const handleRestart = resetSimulationState;
  const handleNovoPregao = generateAndAddNewSessionForAllTimeframes;

  // Handler para seleção de pregão no dropdown
  const handleSessionSelect = (value: string) => {
    const index = parseInt(value, 10);
    const currentSessions = getCurrentTimeframeSessions();
    if (!isNaN(index) && index >= 0 && index < currentSessions.length) {
      setCurrentSessionIndex(index);
      resetSimulationState();
    }
  };
  
  // Handler para mudança de timeframe
  const handleTimeframeChange = (newTimeframe: string) => {
      if (newTimeframe && AVAILABLE_TIMEFRAMES.includes(newTimeframe)) {
          setTimeframe(newTimeframe);
          resetSimulationState(); // Reseta a simulação ao mudar timeframe
          // Verifica se já existem dados para este timeframe, se não, gera
          // Nota: A geração inicial já cria para todos, então isso pode não ser necessário
          // if (!tradingSessions[newTimeframe] || tradingSessions[newTimeframe].length === 0) {
          //   // Idealmente, buscaria dados ou geraria especificamente, mas a lógica atual já gera todos
          // }
      }
  };

  // Handler para salvar configurações
  const handleSaveChanges = () => {
    const newLimit = parseInt(tempMaxSessions, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setMaxSessions(newLimit);
      // Ajusta a lista de sessões para CADA timeframe
      const updatedSessionsByTf: Record<string, CandleData[][]> = {};
      let maxIndexAffected = -1;

      AVAILABLE_TIMEFRAMES.forEach(tf => {
          const prevSessions = tradingSessions[tf] || [];
          if (prevSessions.length > newLimit) {
              const sessionsToKeep = prevSessions.slice(prevSessions.length - newLimit);
              updatedSessionsByTf[tf] = sessionsToKeep;
              // Calcula o índice máximo que foi removido para ajustar o currentSessionIndex
              maxIndexAffected = Math.max(maxIndexAffected, prevSessions.length - newLimit -1);
          } else {
              updatedSessionsByTf[tf] = prevSessions;
          }
      });
      setTradingSessions(updatedSessionsByTf);
      // Ajusta o índice da sessão atual se ele foi removido
      if (currentSessionIndex <= maxIndexAffected) {
          setCurrentSessionIndex(0); // Volta para o primeiro índice válido
      }

    } else {
      setTempMaxSessions(maxSessions.toString());
    }
  };

  // Dados para o gráfico (baseado no timeframe e índice de sessão atuais)
  const currentSessionsForTimeframe = getCurrentTimeframeSessions();
  const currentSessionData = currentSessionsForTimeframe[currentSessionIndex] || [];
  const numberOfSessionsAvailable = currentSessionsForTimeframe.length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-4 space-y-4">
      {/* Header Controls */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex flex-col space-y-4">
          {/* Timeframe Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block text-gray-400">Timeframe</Label>
            <ToggleGroup 
              type="single" 
              value={timeframe} 
              onValueChange={handleTimeframeChange} // Usa o novo handler
              className="grid grid-cols-4 gap-2" // Ajusta para 4 colunas
            >
              {AVAILABLE_TIMEFRAMES.map((tf) => (
                <ToggleGroupItem key={tf} value={tf} className="text-gray-400 border-gray-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white hover:bg-gray-700">
                  {tf}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Botão Novo Pregão */}
            <Button onClick={handleNovoPregao} variant="outline" className="text-sm border-gray-600 text-gray-300 hover:bg-gray-700">
              Novo Pregão
            </Button>
            {/* Seletor de Pregão */}
            <Select 
              value={currentSessionIndex.toString()} 
              onValueChange={handleSessionSelect}
              disabled={numberOfSessionsAvailable === 0}
            >
              <SelectTrigger className="w-full text-sm border-gray-600 text-gray-300 hover:bg-gray-700">
                <SelectValue placeholder="Selecionar Pregão" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-gray-300">
                {Array.from({ length: numberOfSessionsAvailable }).map((_, index) => (
                  <SelectItem 
                    key={index} 
                    value={index.toString()} 
                    className="hover:bg-gray-700 focus:bg-blue-600 focus:text-white"
                  >
                    Pregão {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Chart Area */}
      <ProfessionalCandleChart
        data={currentSessionData} // Passa os dados do timeframe/sessão atual
        currentIndex={currentCandleIndex}
        currentCandle={currentCandleData}
        isActive={isPlaying || currentCandleIndex >= 0}
      />

      {/* Trading Controls */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="space-y-4">
          {/* Balance and Contracts */}
           <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="contracts" className="text-sm font-medium text-gray-400">Quantidade de Contratos</Label>
              <Input
                id="contracts"
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                min="1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="initialBalance" className="text-sm font-medium text-gray-400">Saldo Inicial</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="finalBalance" className="text-sm font-medium text-gray-400">Saldo Final</Label>
                <Input
                  id="finalBalance"
                  type="number"
                  value={finalBalance}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={handlePlayPause}
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              className={`flex items-center justify-center ${isPlaying ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={handleStop} variant="outline" size="sm" className="flex items-center justify-center border-gray-600 text-gray-300 hover:bg-red-700">
              <Square className="w-4 h-4" />
            </Button>
            <Button onClick={handleRestart} variant="outline" size="sm" className="flex items-center justify-center border-gray-600 text-gray-300 hover:bg-blue-700">
              <RotateCcw className="w-4 h-4" />
            </Button>
            {/* Botão Configurações */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Settings className="w-4 h-4 mr-1" /> Config
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-600 text-gray-300">
                <DialogHeader>
                  <DialogTitle className="text-white">Configurações</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Ajuste as configurações do simulador.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="max-sessions" className="text-right text-gray-400">
                      Limite Pregões
                    </Label>
                    <Input
                      id="max-sessions"
                      type="number"
                      value={tempMaxSessions}
                      onChange={(e) => setTempMaxSessions(e.target.value)}
                      className="col-span-3 bg-gray-700 border-gray-500 text-white"
                      min="1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="secondary" className="text-gray-300 bg-gray-600 hover:bg-gray-500">
                        Cancelar
                      </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button type="button" onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Salvar Alterações
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Speed Controls */}
           <div>
            <Label className="text-sm font-medium mb-2 block text-gray-400">Velocidade</Label>
            <ToggleGroup type="single" value={speed} onValueChange={setSpeed} className="grid grid-cols-4 gap-2">
              {['1x', '2x', '5x', '10x'].map((sp) => (
                <ToggleGroupItem key={sp} value={sp} className="text-gray-400 border-gray-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white hover:bg-gray-700 text-xs">
                  {sp}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </Card>

      {/* Status Bar */}
      <Card className="p-3 bg-gray-900 border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${isPlaying ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {isPlaying ? 'Em Execução' : 'Parado'}
            </span>
            <span className="text-gray-500">Velocidade: {speed}</span>
            <span className="text-gray-500">Candle: {currentCandleIndex >= 0 ? currentCandleIndex + 1 : 0} / {currentSessionData.length}</span>
            <span className="text-gray-500">Pregão: {currentSessionIndex + 1} / {numberOfSessionsAvailable}</span>
            <span className="text-gray-500">Timeframe: {timeframe}</span> {/* Mostra timeframe atual */}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">P&L</div>
            <div className={`font-mono ${parseFloat(finalBalance) >= parseFloat(initialBalance) ? 'text-green-400' : 'text-red-400'}`}>
              {(parseFloat(finalBalance) - parseFloat(initialBalance)).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TradingSimulator;
