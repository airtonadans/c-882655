
import React, { useState } from 'react';
import ProfessionalReplayControls from './ProfessionalReplayControls';
import ProfessionalCandleChart from './ProfessionalCandleChart';
import { useReplaySystem } from '../hooks/useReplaySystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('replay');
  const [simulationData] = useState<SimulationData>({
    trades: [],
    totalOperations: 0,
    successRate: 0,
    totalPnL: 0,
    finalBalance: 10000,
    isRunning: false
  });

  const {
    state: replayState,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    changeSpeed,
    setOnCandleUpdate
  } = useReplaySystem();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Profissional */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Simulador Profissional de Trading
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Sistema Avançado de Análise e Replay de Mercado
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Activity className="w-3 h-3 mr-1" />
                Versão Pro
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1">
              <TabsTrigger 
                value="replay" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                Modo Replay
              </TabsTrigger>
              <TabsTrigger 
                value="strategy"
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <TrendingUp className="w-4 h-4" />
                Estratégias
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="replay" className="space-y-6">
            {/* Controles do Replay */}
            <ProfessionalReplayControls
              onStartReplay={startReplay}
              onPauseReplay={pauseReplay}
              onStopReplay={stopReplay}
              onResetReplay={resetReplay}
              onSpeedChange={changeSpeed}
              isPlaying={replayState.isPlaying}
              isPaused={replayState.isPaused}
              currentSpeed={replayState.speed}
              progress={replayState.progress}
              totalCandles={replayState.totalCandles}
              currentIndex={replayState.currentIndex}
            />

            {/* Gráfico Principal */}
            <ProfessionalCandleChart
              data={replayState.data}
              currentIndex={replayState.currentIndex}
              currentCandle={replayState.currentCandle}
              isActive={replayState.isActive}
            />

            {/* Status e Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Status do Sistema</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {replayState.isActive ? 'Ativo' : 'Aguardando'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Candles Processados</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {replayState.currentIndex} / {replayState.totalCandles}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Velocidade Atual</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {replayState.speed}x
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="strategy" className="space-y-6">
            <Card className="p-8 bg-white dark:bg-slate-800 text-center">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Estratégias de Trading
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Módulo de estratégias automatizadas em desenvolvimento.
              </p>
              <Badge variant="secondary">Em Breve</Badge>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CryptoStrategySimulator;
