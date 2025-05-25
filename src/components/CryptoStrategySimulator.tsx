
import React, { useState } from 'react';
import TradingChart from './TradingChart';
import CryptoPairSelector from './CryptoPairSelector';
import StrategyControls from './StrategyControls';
import SimulationStats from './SimulationStats';
import TimeframeSelector from './TimeframeSelector';

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
  const [simulationData, setSimulationData] = useState<SimulationData>({
    trades: [],
    totalOperations: 0,
    successRate: 0,
    totalPnL: 0,
    finalBalance: 10000,
    isRunning: false
  });

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

      {/* Strategy Controls */}
      <div className="p-4 border-b border-border">
        <StrategyControls 
          onStart={handleStartStrategy}
          onStop={handleStopStrategy}
          onReset={handleResetStrategy}
          isRunning={simulationData.isRunning}
        />
      </div>

      {/* Trading Chart */}
      <div className="p-4">
        <TradingChart 
          symbol={selectedPair}
          interval={timeframe}
          trades={simulationData.trades}
        />
      </div>

      {/* Simulation Statistics */}
      <div className="p-4">
        <SimulationStats data={simulationData} />
      </div>
    </div>
  );
};

export default CryptoStrategySimulator;
