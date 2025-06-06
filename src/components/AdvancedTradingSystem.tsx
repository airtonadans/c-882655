
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, RotateCcw, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import ProfessionalTradingChart from './ProfessionalTradingChart';
import { useRealMarketData } from '../hooks/useRealMarketData';
import { DataValidator, DataNormalizer, NormalizedCandle } from '../utils/dataValidator';
import { ReplayEngine, ReplayCallbacks } from '../utils/replayEngine';
import { BacktestEngine, SMAStrategy, BacktestResult } from '../utils/backtestEngine';
import { CandleData } from '../utils/advancedMarketGenerator';
import { toast } from 'sonner';

const AdvancedTradingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('replay');
  const [rawData, setRawData] = useState<CandleData[]>([]);
  const [normalizedData, setNormalizedData] = useState<NormalizedCandle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const replayEngineRef = useRef<ReplayEngine | null>(null);
  const { getMarketData, isLoading } = useRealMarketData();

  // Callbacks do Replay Engine
  const replayCallbacks: ReplayCallbacks = {
    onCandleUpdate: (candle: CandleData, index: number) => {
      setCurrentCandle(candle);
      setCurrentIndex(index);
    },
    onReplayEnd: () => {
      toast.success('Replay finalizado!');
    },
    onProgress: (progress: number) => {
      console.log(`Replay progress: ${progress.toFixed(1)}%`);
    }
  };

  // Carregar dados de teste
  const loadTestData = async () => {
    try {
      const data = await getMarketData({
        symbol: 'XAUUSD',
        startDate: '2024-01-09',
        endDate: '2024-01-09',
        timeframe: '5min',
        limit: 100
      });

      if (data.length === 0) {
        toast.error('Nenhum dado encontrado. Carregue dados primeiro na aba "Dados".');
        return;
      }

      console.log('🔍 Raw data loaded:', data.length, 'candles');
      setRawData(data);
      
      // Validar dados
      const validation = DataValidator.validateCandleSequence(data);
      setValidationErrors(validation.errors);
      
      if (validation.errors.length > 0) {
        toast.warning(`${validation.errors.length} erros de validação encontrados`);
        console.log('❌ Validation errors:', validation.errors);
      }

      // Normalizar dados
      const normalized = DataNormalizer.normalizeCandleSequence(data);
      setNormalizedData(normalized);
      
      console.log('✅ Data normalized:', normalized.length, 'candles');
      toast.success(`Dados carregados: ${normalized.length} candles normalizados`);

      // Reinicializar Replay Engine
      if (replayEngineRef.current) {
        replayEngineRef.current.destroy();
      }
      replayEngineRef.current = new ReplayEngine(normalized, replayCallbacks);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  };

  // Controles do Replay
  const startReplay = () => {
    if (!replayEngineRef.current) return;
    replayEngineRef.current.start(replaySpeed);
  };

  const pauseReplay = () => {
    if (!replayEngineRef.current) return;
    replayEngineRef.current.pause();
  };

  const stopReplay = () => {
    if (!replayEngineRef.current) return;
    replayEngineRef.current.stop();
    setCurrentIndex(-1);
    setCurrentCandle(null);
  };

  const resetReplay = () => {
    if (!replayEngineRef.current) return;
    replayEngineRef.current.reset();
    setCurrentIndex(-1);
    setCurrentCandle(null);
  };

  // Executar Backtest
  const runBacktest = () => {
    if (normalizedData.length === 0) {
      toast.error('Carregue dados primeiro!');
      return;
    }

    const strategy = new SMAStrategy(10, 20);
    const config = {
      initialBalance: 10000,
      commissionRate: 0.001,
      slippageRate: 0.0001,
      maxPositionSize: 1000
    };

    const backtestEngine = new BacktestEngine(strategy, config);
    const result = backtestEngine.runBacktest(normalizedData);
    
    setBacktestResult(result);
    toast.success(`Backtest concluído: ${result.totalTrades} trades executados`);
  };

  useEffect(() => {
    return () => {
      if (replayEngineRef.current) {
        replayEngineRef.current.destroy();
      }
    };
  }, []);

  const replayState = replayEngineRef.current?.getState();

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-4 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Sistema de Trading Avançado</h1>
                <p className="text-xs text-gray-400">
                  Normalizador + Replay Engine + Backtest Engine
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={loadTestData} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Carregando...' : 'Carregar Dados'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Dados Carregados</p>
                <p className="text-sm font-semibold text-white">{normalizedData.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-400">Status Replay</p>
                <p className="text-sm font-semibold text-white">
                  {replayState?.isPlaying ? (replayState.isPaused ? 'Pausado' : 'Executando') : 'Parado'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Progresso</p>
                <p className="text-sm font-semibold text-white">
                  {currentIndex + 1} / {normalizedData.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-400">Erros Validação</p>
                <p className="text-sm font-semibold text-white">{validationErrors.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="replay" className="data-[state=active]:bg-blue-600">
              Replay Engine
            </TabsTrigger>
            <TabsTrigger value="backtest" className="data-[state=active]:bg-green-600">
              Backtest Engine
            </TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-purple-600">
              Validação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="replay" className="space-y-4">
            {/* Replay Controls */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Controles do Replay</h3>
                <Badge className="bg-blue-600">
                  Velocidade: {replaySpeed}x
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={startReplay} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
                <Button onClick={pauseReplay} variant="outline" className="border-gray-600">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
                <Button onClick={stopReplay} variant="outline" className="border-gray-600">
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
                <Button onClick={resetReplay} variant="outline" className="border-gray-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>

            {/* Chart */}
            <ProfessionalTradingChart
              data={normalizedData}
              currentIndex={currentIndex}
              currentCandle={currentCandle}
              isActive={currentIndex >= 0}
            />
          </TabsContent>

          <TabsContent value="backtest" className="space-y-4">
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Backtest Engine</h3>
                <Button onClick={runBacktest} className="bg-green-600 hover:bg-green-700">
                  Executar Backtest
                </Button>
              </div>
              
              {backtestResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Total de Trades</p>
                    <p className="text-lg font-semibold text-white">{backtestResult.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Taxa de Acerto</p>
                    <p className="text-lg font-semibold text-green-400">{backtestResult.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">P&L Total</p>
                    <p className={`text-lg font-semibold ${backtestResult.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${backtestResult.totalPnL.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Max Drawdown</p>
                    <p className="text-lg font-semibold text-red-400">{backtestResult.maxDrawdown.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card className="p-4 bg-gray-900 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Relatório de Validação</h3>
              
              {validationErrors.length === 0 ? (
                <Badge className="bg-green-600">✅ Todos os dados são válidos</Badge>
              ) : (
                <div className="space-y-2">
                  <Badge className="bg-red-600">❌ {validationErrors.length} erros encontrados</Badge>
                  <div className="bg-gray-800 p-3 rounded text-sm">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-red-400">• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedTradingSystem;
