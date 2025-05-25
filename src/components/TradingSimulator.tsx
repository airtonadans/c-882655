
import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Heart, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TradingSimulator = () => {
  const [timeframe, setTimeframe] = useState('1min');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [contracts, setContracts] = useState('1');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [finalBalance, setFinalBalance] = useState('10000');
  const [isFavorited, setIsFavorited] = useState(false);

  const timeframes = ['1min', '2min', '5min'];
  const speeds = ['1x', '2x', '5x', '10x'];

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setFinalBalance(initialBalance);
  };

  const handleNewScenario = () => {
    setIsPlaying(false);
    setFinalBalance(initialBalance);
    console.log('Novo cenário carregado');
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleLoadStrategy = (strategy: string) => {
    console.log(`Estratégia ${strategy} carregada`);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header Controls */}
      <Card className="p-4 bg-secondary/20 border-muted">
        <div className="flex flex-col space-y-4">
          {/* Timeframe Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Timeframe</Label>
            <ToggleGroup type="single" value={timeframe} onValueChange={setTimeframe} className="grid grid-cols-3 gap-2">
              {timeframes.map((tf) => (
                <ToggleGroupItem key={tf} value={tf} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  {tf}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleNewScenario} variant="outline" className="text-sm">
              Novo Cenário
            </Button>
            <Button onClick={handleFavorite} variant="outline" className="text-sm">
              <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
              Favoritar
            </Button>
          </div>

          {/* Strategy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleLoadStrategy('A')} variant="outline" className="text-sm">
              <Upload className="w-4 h-4 mr-2" />
              Estratégia A
            </Button>
            <Button onClick={() => handleLoadStrategy('B')} variant="outline" className="text-sm">
              <Upload className="w-4 h-4 mr-2" />
              Estratégia B
            </Button>
          </div>
        </div>
      </Card>

      {/* Chart Area */}
      <Card className="p-4 bg-secondary/20 border-muted">
        <div className="h-64 bg-background rounded-lg border border-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-sm">Gráfico de Candles</p>
            <p className="text-xs opacity-70">Timeframe: {timeframe}</p>
          </div>
        </div>
      </Card>

      {/* Trading Controls */}
      <Card className="p-4 bg-secondary/20 border-muted">
        <div className="space-y-4">
          {/* Balance and Contracts */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="contracts" className="text-sm font-medium">Quantidade de Contratos</Label>
              <Input
                id="contracts"
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="mt-1"
                min="1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="initialBalance" className="text-sm font-medium">Saldo Inicial</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="finalBalance" className="text-sm font-medium">Saldo Final</Label>
                <Input
                  id="finalBalance"
                  type="number"
                  value={finalBalance}
                  onChange={(e) => setFinalBalance(e.target.value)}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={handlePlay}
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              className="flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={handleStop} variant="outline" size="sm" className="flex items-center justify-center">
              <Square className="w-4 h-4" />
            </Button>
            <Button onClick={handleRestart} variant="outline" size="sm" className="flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Config
            </Button>
          </div>

          {/* Speed Controls */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Velocidade</Label>
            <ToggleGroup type="single" value={speed} onValueChange={setSpeed} className="grid grid-cols-4 gap-2">
              {speeds.map((sp) => (
                <ToggleGroupItem key={sp} value={sp} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs">
                  {sp}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </Card>

      {/* Status Bar */}
      <Card className="p-3 bg-secondary/20 border-muted">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded text-xs ${isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPlaying ? 'Em Execução' : 'Parado'}
            </span>
            <span className="text-muted-foreground">Velocidade: {speed}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">P&L</div>
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
