
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { SimulationData } from './CryptoStrategySimulator';

interface SimulationStatsProps {
  data: SimulationData;
}

const SimulationStats: React.FC<SimulationStatsProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Estatísticas da Simulação
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">
            {data.totalOperations}
          </div>
          <div className="text-xs text-muted-foreground">Operações</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${
            data.successRate >= 50 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatPercentage(data.successRate)}
          </div>
          <div className="text-xs text-muted-foreground">Taxa de Acerto</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
            data.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.totalPnL >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatCurrency(data.totalPnL)}
          </div>
          <div className="text-xs text-muted-foreground">P&L Total</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${
            data.finalBalance >= 10000 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(data.finalBalance)}
          </div>
          <div className="text-xs text-muted-foreground">Saldo Final</div>
        </div>
      </div>

      {data.trades.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Últimas Operações</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.trades.slice(-3).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="capitalize">{trade.type}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(trade.price)}
                  </span>
                </div>
                {trade.profit && (
                  <span className={`font-medium ${
                    trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trade.profit > 0 ? '+' : ''}{formatCurrency(trade.profit)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SimulationStats;
