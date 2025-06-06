
import React, { useState } from 'react';
import ProfessionalTradingChart from './ProfessionalTradingChart';
import ReplayModeControls from './ReplayModeControls';
import HistoryModeControls from './HistoryModeControls';
import DataSourceManager from './DataSourceManager';
import DataAuditPanel from './DataAuditPanel';
import { useReplayData } from '../hooks/useReplayData';
import { useHistoryData } from '../hooks/useHistoryData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3, Database, History, Play } from 'lucide-react';
import { toast } from 'sonner';

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  time: number;
  profit?: number;
}

export interface SimulationData {
  trades: Trade[];
  totalOperations: number;
  successRate: number;
  totalPnL: number;
  finalBalance: number;
  isRunning: boolean;
}

const CryptoStrategySimulator = () => {
  const [activeTab, setActiveTab] = useState('data');
  
  // Replay mode hooks
  const {
    state: replayState,
    isLoading: replayLoading,
    loadReplayData,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    changeSpeed,
    jumpToPosition
  } = useReplayData();

  // History mode hooks
  const {
    state: historyState,
    isLoading: historyLoading,
    loadHistoryData,
    clearHistoryData
  } = useHistoryData();

  const handleStartReplay = async (date: string, timeframe: string, speed: number) => {
    try {
      await loadReplayData(date, timeframe);
      startReplay(speed);
      toast.success(`Replay iniciado para ${date} (${timeframe})`);
    } catch (error: any) {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  };

  const handleLoadHistory = async (startDate: string, endDate: string, timeframe: string) => {
    try {
      await loadHistoryData(startDate, endDate, timeframe);
      toast.success(`Histórico carregado: ${startDate} a ${endDate} (${timeframe})`);
    } catch (error: any) {
      toast.error(`Erro ao carregar histórico: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Trading Simulator Pro
                </h1>
                <p className="text-xs text-gray-400">
                  Sistema Profissional com TradingView Charts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-green-600 text-white">
                <Database className="w-3 h-3 mr-1" />
                TradingView Enabled
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-4 bg-gray-800 border border-gray-700 p-1 w-full max-w-2xl">
              <TabsTrigger 
                value="data"
                className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-300"
              >
                <Database className="w-4 h-4" />
                Auditoria
              </TabsTrigger>
              <TabsTrigger 
                value="replay" 
                className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-gray-300"
              >
                <Play className="w-4 h-4" />
                Replay
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-gray-300"
              >
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger 
                value="manager"
                className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-gray-300"
              >
                <Database className="w-4 h-4" />
                Dados
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="data" className="space-y-6">
            <DataAuditPanel />
          </TabsContent>
          
          <TabsContent value="replay" className="space-y-6">
            {/* Modo Replay - Data específica com controles */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">Modo Replay</h2>
                <Badge className="bg-blue-600 text-white text-xs">
                  TradingView Professional
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Selecione uma data específica e acompanhe a evolução dos preços em tempo acelerado com gráficos profissionais.
              </p>
              
              <ReplayModeControls
                onStartReplay={handleStartReplay}
                onPauseReplay={pauseReplay}
                onStopReplay={stopReplay}
                onResetReplay={resetReplay}
                onSpeedChange={changeSpeed}
                onJumpToPosition={jumpToPosition}
                isPlaying={replayState.isPlaying}
                isPaused={replayState.isPaused}
                currentSpeed={replayState.speed}
                progress={replayState.progress}
                totalCandles={replayState.totalCandles}
                currentIndex={replayState.currentIndex}
              />
            </Card>

            {/* Gráfico do Replay com TradingView */}
            <ProfessionalTradingChart
              data={replayState.data}
              currentIndex={replayState.currentIndex}
              currentCandle={replayState.currentCandle}
              isActive={replayState.isPlaying || replayState.currentIndex >= 0}
            />

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-gray-900 border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm font-semibold text-white">
                      {replayState.isPlaying ? 'Executando' : replayState.isPaused ? 'Pausado' : 'Parado'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-900 border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Progresso</p>
                    <p className="text-sm font-semibold text-white">
                      {replayState.currentIndex + 1} / {replayState.totalCandles}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-900 border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Velocidade</p>
                    <p className="text-sm font-semibold text-white">
                      {replayState.speed}x
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            {/* Modo Histórico - Período completo sem controles */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Modo Histórico</h2>
                <Badge className="bg-purple-600 text-white text-xs">
                  TradingView Professional
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Visualize o gráfico completo de um período específico com renderização profissional.
              </p>
              
              <HistoryModeControls
                onLoadHistory={handleLoadHistory}
                isLoading={historyLoading}
                totalCandles={historyState.totalCandles}
              />
            </Card>

            {/* Gráfico do Histórico com TradingView */}
            {historyState.isLoaded && (
              <ProfessionalTradingChart
                data={historyState.data}
                currentIndex={historyState.data.length - 1}
                currentCandle={historyState.data[historyState.data.length - 1]}
                isActive={true}
              />
            )}

            {/* Placeholder quando não há dados */}
            {!historyState.isLoaded && !historyLoading && (
              <Card className="p-8 bg-gray-900 border-gray-700 text-center">
                <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Gráfico Histórico Profissional
                </h3>
                <p className="text-gray-400 mb-6">
                  Selecione um período acima para carregar o gráfico histórico com renderização TradingView.
                </p>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  Aguardando Período
                </Badge>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="manager" className="space-y-6">
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-white">Gerenciamento de Dados</h2>
                <Badge className="bg-green-600 text-white text-xs">
                  Fonte: Dados Realistas
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Configure e gerencie os dados de mercado para análise profissional.
              </p>
            </Card>
            
            <DataSourceManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CryptoStrategySimulator;
