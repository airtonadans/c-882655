
import React from 'react';
import { Play, Square, RotateCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StrategyControlsProps {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
}

const StrategyControls: React.FC<StrategyControlsProps> = ({
  onStart,
  onStop,
  onReset,
  isRunning,
}) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Estratégia NTSL</h3>
            <p className="text-xs text-muted-foreground">
              Stop ATR + DEMA + Take Profit
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={isRunning ? onStop : onStart}
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar NTSL
              </>
            )}
          </Button>
          
          <Button 
            onClick={onReset}
            variant="outline"
            size="sm"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {isRunning && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400">Estratégia ativa - monitorando sinais</span>
        </div>
      )}
    </Card>
  );
};

export default StrategyControls;
