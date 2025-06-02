
import React, { useState } from 'react';
import { Download, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRealMarketData } from '../hooks/useRealMarketData';
import { toast } from 'sonner';

const DataSourceManager: React.FC = () => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const { fetchKaggleData, isLoading, availableRanges, refreshAvailableRanges } = useRealMarketData();

  React.useEffect(() => {
    refreshAvailableRanges();
  }, [refreshAvailableRanges]);

  const handleFetchData = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, selecione as datas de início e fim');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('A data de início deve ser anterior à data de fim');
      return;
    }

    try {
      await fetchKaggleData({
        symbol: 'XAUUSD',
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  return (
    <Card className="p-6 bg-gray-900 border-gray-700 text-white">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100">
                Gerenciador de Dados
              </h3>
              <p className="text-sm text-gray-400">
                Buscar dados reais do Kaggle para análise
              </p>
            </div>
          </div>
          
          <Badge className="text-xs bg-blue-600 text-white">
            XAUUSD (Ouro)
          </Badge>
        </div>

        {/* Período para busca */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-300">
            Período para Buscar Dados
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Data de Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Botão para buscar dados */}
        <Button
          onClick={handleFetchData}
          disabled={isLoading}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Buscando Dados do Kaggle...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Buscar Dados do Kaggle
            </>
          )}
        </Button>

        {/* Dados disponíveis */}
        {availableRanges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <Label className="text-sm font-medium text-gray-300">
                Dados Disponíveis no Banco
              </Label>
            </div>
            
            <div className="space-y-2">
              {availableRanges.map((range, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {range.symbol || 'XAUUSD'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {range.start_date} até {range.end_date}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                      {range.total_ticks || 0} registros
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-400">
                Como Usar
              </p>
              <div className="text-xs text-gray-300 space-y-1">
                <p>1. Selecione o período desejado (ex: 2024-01-01 a 2024-12-31)</p>
                <p>2. Clique em "Buscar Dados do Kaggle" para carregar dados reais</p>
                <p>3. Após o carregamento, use os modos Replay e Histórico normalmente</p>
                <p>4. Os dados ficam salvos no banco e podem ser reutilizados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DataSourceManager;
