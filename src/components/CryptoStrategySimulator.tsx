
import React, { useState } from 'react';
import TradingChart from './TradingChart';
import ReplayChart from './ReplayChart';
import CryptoPairSelector from './CryptoPairSelector';
import StrategyControls from './StrategyControls';
import SimulationStats from './SimulationStats';
import TimeframeSelector from './TimeframeSelector';
import ReplayControls from './ReplayControls';
import { useReplayMode } from '../hooks/useReplayMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1');
  const [activeTab, setActiveTab] = useState('strategy');
  const [simulationData, setSimulationData] = useState<SimulationData>({
    trades: [],
    totalOperations: 0,
    successRate: 0,
    totalPnL: 0,
    finalBalance: 10000,
    isRunning: false
  });

  const {
    replayState,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    setOnCandleUpdate,
    changeSpeed,
    jumpToPosition,
  } = useReplayMode();

  const handleStartStrategy = () => {
    console.log('Iniciando estratégia NTSL para', selectedPair);
    setSimulationData(prev => ({ ...prev, isRunning: true }));
    
    // Simular trades aleatórios para demonstração
    setTimeout(() => {
      const mockTrades: Trade[] = [
        { id: '1', type: 'buy', price: 45000, time: Date.now() - 3600000 },
        { id: '2', type: 'sell', price: 46500, time: Date.now() - 1800000, profit: 1500 },
        { id: '3', type: 'buy', price: 46200, time: Date.now() - 900000 },
      ];
      
      setSimulationData(prev => ({
        ...prev,
        trades: mockTrades,
        totalOperations: mockTrades.length,
        successRate: 66.67,
        totalPnL: 1200,
        finalBalance: 11200
      }));
    }, 2000);
  };

  const handleStopStrategy = () => {
    console.log('Parando estratégia NTSL');
    setSimulationData(prev => ({ ...prev, isRunning: false }));
  };

  const handleResetStrategy = () => {
    console.log('Resetando estratégia NTSL');
    setSimulationData({
      trades: [],
      totalOperations: 0,
      successRate: 0,
      totalPnL: 0,
      finalBalance: 10000,
      isRunning: false
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Simulador NTSL</h1>
            <p className="text-sm text-muted-foreground">Estratégias para Criptomoedas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <CryptoPairSelector 
              selectedPair={selectedPair}
              onPairChange={setSelectedPair}
            />
            <TimeframeSelector 
              selectedTimeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>
        </div>
      </div>

      {/* Tabs para alternar entre Estratégia e Replay */}
      <div className="p-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="strategy" className="data-[state=active]:bg-background">
              Estratégia NTSL
            </TabsTrigger>
            <TabsTrigger value="replay" className="data-[state=active]:bg-background">
              Modo Replay
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategy" className="mt-4">
            <StrategyControls 
              onStart={handleStartStrategy}
              onStop={handleStopStrategy}
              onReset={handleResetStrategy}
              isRunning={simulationData.isRunning}
            />
          </TabsContent>
          
          <TabsContent value="replay" className="mt-4">
            <ReplayControls
              onStartReplay={startReplay}
              onPauseReplay={pauseReplay}
              onStopReplay={stopReplay}
              onResetReplay={resetReplay}
              onSpeedChange={changeSpeed}
              isPlaying={replayState.isPlaying}
              isPaused={replayState.isPaused}
              currentSpeed={replayState.speed}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Trading Chart / Replay Chart */}
      <div className="p-4">
        {activeTab === 'strategy' ? (
          <TradingChart 
            symbol={selectedPair}
            interval={timeframe}
            trades={simulationData.trades}
            replayMode={false}
          />
        ) : (
          <ReplayChart
            data={replayState.data}
            currentIndex={replayState.currentIndex}
            onJumpToPosition={jumpToPosition}
            speed={replayState.speed}
          />
        )}
      </div>

      {/* Simulation Statistics */}
      <div className="p-4">
        {activeTab === 'strategy' ? (
          <SimulationStats data={simulationData} />
        ) : (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Status do Replay</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Candles Processados:</span>
                <p className="font-mono text-lg">{replayState.currentIndex}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total de Candles:</span>
                <p className="font-mono text-lg">{replayState.data.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Velocidade:</span>
                <p className="font-mono text-lg">{replayState.speed}x</p>
              </div>
              <div>
                <span className="text-muted-foreground">Progresso:</span>
                <p className="font-mono text-lg">
                  {replayState.data.length > 0 
                    ? Math.round((replayState.currentIndex / replayState.data.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            
            {/* Timeline com período atual */}
            {replayState.data.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Período do Replay:</span>
                    <p className="font-mono">
                      {new Date(replayState.data[0].time * 1000).toLocaleDateString()} - {' '}
                      {new Date(replayState.data[replayState.data.length - 1].time * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  {replayState.currentIndex > 0 && (
                    <div>
                      <span className="text-muted-foreground">Posição Atual:</span>
                      <p className="font-mono">
                        {new Date(replayState.data[replayState.currentIndex - 1].time * 1000).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoStrategySimulator;
