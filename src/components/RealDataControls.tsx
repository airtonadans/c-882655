
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database, Download, RefreshCw, Activity } from 'lucide-react';
import { useRealMarketData } from '../hooks/useRealMarketData';
import { toast } from 'sonner';

interface RealDataControlsProps {
  onDataLoaded: (data: any[]) => void;
}

const RealDataControls: React.FC<RealDataControlsProps> = ({ onDataLoaded }) => {
  const [startDate, setStartDate] = useState('2023-10-01');
  const [endDate, setEndDate] = useState('2023-10-07');
  const [symbol, setSymbol] = useState('XAUUSD');
  const [selectedRange, setSelectedRange] = useState<any>(null);

  const {
    isLoading,
    availableRanges,
    fetchKaggleData,
    getMarketData,
    refreshAvailableRanges
  } = useRealMarketData();

  useEffect(() => {
    refreshAvailableRanges();
  }, [refreshAvailableRanges]);

  const handleFetchData = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, selecione as datas de início e fim');
      return;
    }

    await fetchKaggleData({
      symbol,
      startDate,
      endDate
    });
  };

  const handleLoadExistingData = async (range?: any) => {
    const rangeToUse = range || selectedRange;
    
    if (!rangeToUse) {
      toast.error('Por favor, selecione um intervalo de dados');
      return;
    }

    const data = await getMarketData({
      symbol: rangeToUse.symbol,
      startDate: rangeToUse.start_date,
      endDate: rangeToUse.end_date,
      limit: 1000
    });

    if (data.length > 0) {
      onDataLoaded(data);
      toast.success(`${data.length} registros carregados para o simulador`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Buscar Novos Dados */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Buscar Dados do Kaggle
            </h3>
            <p className="text-xs text-gray-400">
              Importar novos dados tick a tick
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <Label htmlFor="symbol" className="text-gray-300 text-xs">Símbolo</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="XAUUSD"
            />
          </div>
          <div>
            <Label htmlFor="startDate" className="text-gray-300 text-xs">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-gray-300 text-xs">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleFetchData}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Buscando Dados...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Buscar Dados
            </>
          )}
        </Button>
      </Card>

      {/* Dados Disponíveis */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-600 rounded-lg">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Dados Disponíveis
              </h3>
              <p className="text-xs text-gray-400">
                Intervalos armazenados no banco
              </p>
            </div>
          </div>
          <Button
            onClick={refreshAvailableRanges}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {availableRanges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum dado disponível</p>
              <p className="text-xs">Busque dados do Kaggle primeiro</p>
            </div>
          ) : (
            availableRanges.map((range, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRange?.id === range.id
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-750'
                }`}
                onClick={() => setSelectedRange(range)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-600 text-black text-xs">
                      {range.symbol}
                    </Badge>
                    <div className="text-xs text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(range.start_date).toLocaleDateString()} - {new Date(range.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {range.total_ticks?.toLocaleString() || 0} ticks
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadExistingData(range);
                      }}
                      size="sm"
                      className="mt-1 bg-green-600 hover:bg-green-700 text-xs h-6"
                    >
                      Carregar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default RealDataControls;
