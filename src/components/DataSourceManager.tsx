
import React, { useState } from 'react';
import { Download, Database, AlertCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
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
  const { fetchKaggleData, isLoading, availableRanges, refreshAvailableRanges, clearAllData } = useRealMarketData();

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

    const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 180) {
      const confirmed = window.confirm(`Você está carregando ${diffDays} dias de dados. Isso pode levar alguns minutos. Deseja continuar?`);
      if (!confirmed) return;
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

  const handleClearData = async () => {
    const confirmed = window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await clearAllData();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  const handleRefreshRanges = async () => {
    try {
      await refreshAvailableRanges();
      toast.success('Lista de dados atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
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
                Buscar e gerenciar dados reais do mercado
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

        {/* Botões de ação */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleFetchData}
            disabled={isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Buscando Dados...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Buscar Dados do Mercado
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleRefreshRanges}
              disabled={isLoading}
              variant="outline"
              className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Lista
            </Button>

            <Button
              onClick={handleClearData}
              disabled={isLoading}
              variant="outline"
              className="border-red-600 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Dados
            </Button>
          </div>
        </div>

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
                      {(range.total_ticks || 0).toLocaleString()} registros
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status quando não há dados */}
        {availableRanges.length === 0 && !isLoading && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-400">
                  Nenhum Dado Encontrado
                </p>
                <p className="text-xs text-gray-300">
                  Carregue alguns dados usando o formulário acima para usar os modos Replay e Histórico.
                </p>
              </div>
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
                <p>• Selecione um período (ex: 2024-01-01 a 2024-03-31)</p>
                <p>• Clique em "Buscar Dados" para carregar/gerar dados</p>
                <p>• Dados já carregados são reutilizados automaticamente</p>
                <p>• Use "Limpar Dados" para resetar o cache</p>
                <p>• Após carregar, use os modos Replay e Histórico normalmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DataSourceManager;
