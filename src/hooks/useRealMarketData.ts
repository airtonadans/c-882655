
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealMarketDataHook {
  isLoading: boolean;
  availableRanges: any[];
  fetchKaggleData: (params: FetchDataParams) => Promise<void>;
  getMarketData: (params: GetMarketDataParams) => Promise<any[]>;
  refreshAvailableRanges: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

export interface FetchDataParams {
  symbol?: string;
  startDate: string;
  endDate: string;
  apiKey?: string;
}

export interface GetMarketDataParams {
  symbol?: string;
  timeframe?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useRealMarketData = (): RealMarketDataHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableRanges, setAvailableRanges] = useState<any[]>([]);

  const fetchKaggleData = useCallback(async (params: FetchDataParams) => {
    setIsLoading(true);
    try {
      console.log('🔍 [AUDIT] Fetching Kaggle data with params:', params);
      
      // Validate date range
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      
      if (start > end) {
        throw new Error('A data de início deve ser anterior à data de fim');
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) {
        toast.info('Período longo detectado. O carregamento pode levar alguns minutos...');
      }
      
      const { data, error } = await supabase.functions.invoke('fetch-kaggle-data', {
        body: {
          symbol: params.symbol || 'XAUUSD',
          startDate: params.startDate,
          endDate: params.endDate,
          apiKey: params.apiKey
        }
      });

      console.log('🔍 [AUDIT] Raw API Response:', data);

      if (error) {
        console.error('🚨 [ERROR] Supabase function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const message = data.source === 'cached-data' 
          ? `Dados encontrados no cache! ${data.tickCount} registros disponíveis.`
          : `Dados carregados com sucesso! ${data.tickCount} ticks importados.`;
        
        console.log('✅ [SUCCESS] Data fetch completed:', {
          source: data.source,
          tickCount: data.tickCount,
          dateRange: data.dateRange
        });
        
        toast.success(message);
        await refreshAvailableRanges();
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao buscar dados');
      }

    } catch (error: any) {
      console.error('🚨 [ERROR] Error fetching Kaggle data:', error);
      toast.error(`Erro ao buscar dados: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMarketData = useCallback(async (params: GetMarketDataParams = {}) => {
    try {
      console.log('🔍 [AUDIT] Getting market data with params:', params);
      
      // Validate parameters
      if (params.startDate && params.endDate) {
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        
        if (start > end) {
          throw new Error('A data de início deve ser anterior à data de fim');
        }
      }
      
      const queryParams = new URLSearchParams();
      if (params.symbol) queryParams.append('symbol', params.symbol);
      if (params.timeframe) queryParams.append('timeframe', params.timeframe);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      console.log('🔗 [API CALL] Query URL:', queryParams.toString());

      const { data, error } = await supabase.functions.invoke('get-market-data?' + queryParams.toString());

      if (error) {
        console.error('🚨 [ERROR] Supabase function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        console.log('✅ [SUCCESS] Market data retrieved:', {
          count: data.count,
          symbol: data.symbol,
          timeframe: data.timeframe,
          dateRange: data.dateRange
        });

        // 🔍 DETAILED DATA AUDIT
        console.log('📊 [DATA AUDIT] First 5 records from API:', data.data?.slice(0, 5));
        console.log('📊 [DATA AUDIT] Last 5 records from API:', data.data?.slice(-5));
        
        if (data.data && data.data.length > 0) {
          const sample = data.data[0];
          console.log('🧪 [SAMPLE ANALYSIS] First record structure:', {
            timestamp: sample.timestamp,
            time: sample.time,
            timeFormatted: new Date(sample.time * 1000).toISOString(),
            open: sample.open,
            high: sample.high,
            low: sample.low,
            close: sample.close,
            volume: sample.volume,
            dataTypes: {
              timestamp: typeof sample.timestamp,
              time: typeof sample.time,
              open: typeof sample.open,
              high: typeof sample.high,
              low: typeof sample.low,
              close: typeof sample.close,
              volume: typeof sample.volume
            }
          });

          // Check for data integrity issues
          const integrityChecks = {
            hasVolume: data.data.filter(d => d.volume > 0).length,
            totalRecords: data.data.length,
            priceVariation: Math.abs(data.data[data.data.length - 1]?.close - data.data[0]?.open),
            avgVolume: data.data.reduce((sum, d) => sum + (d.volume || 0), 0) / data.data.length,
            uniqueTimes: new Set(data.data.map(d => d.time)).size
          };

          console.log('🔍 [INTEGRITY CHECK]:', {
            ...integrityChecks,
            volumePercentage: (integrityChecks.hasVolume / integrityChecks.totalRecords * 100).toFixed(2) + '%',
            duplicateTimes: integrityChecks.totalRecords - integrityChecks.uniqueTimes
          });

          // Check for unrealistic price movements
          const priceMovements = [];
          for (let i = 1; i < Math.min(data.data.length, 10); i++) {
            const prev = data.data[i - 1];
            const curr = data.data[i];
            const change = ((curr.close - prev.close) / prev.close) * 100;
            priceMovements.push({
              index: i,
              prevClose: prev.close,
              currClose: curr.close,
              changePercent: change.toFixed(4) + '%',
              time: new Date(curr.time * 1000).toISOString()
            });
          }
          console.log('📈 [PRICE MOVEMENTS] First 10 candle changes:', priceMovements);
        }

        return data.data || [];
      } else {
        console.warn('⚠️ [WARNING] No data returned:', data?.error);
        if (data?.error?.includes('Nenhum dado encontrado')) {
          toast.warning('Nenhum dado encontrado para o período. Carregue os dados primeiro na aba "Dados".');
        }
        return [];
      }

    } catch (error: any) {
      console.error('🚨 [ERROR] Error getting market data:', error);
      toast.error(`Erro ao obter dados: ${error.message}`);
      return [];
    }
  }, []);

  const refreshAvailableRanges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('available_data_ranges')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error refreshing available ranges:', error);
        throw error;
      }

      console.log('Available ranges refreshed:', data?.length || 0, 'ranges found');
      setAvailableRanges(data || []);
    } catch (error: any) {
      console.error('Error refreshing available ranges:', error);
      toast.error(`Erro ao buscar intervalos disponíveis: ${error.message}`);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear tick_data
      const { error: tickError } = await supabase
        .from('tick_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (tickError) {
        console.error('Error clearing tick data:', tickError);
        throw tickError;
      }

      // Clear available_data_ranges
      const { error: rangeError } = await supabase
        .from('available_data_ranges')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (rangeError) {
        console.error('Error clearing range data:', rangeError);
        throw rangeError;
      }

      await refreshAvailableRanges();
      toast.success('Todos os dados foram limpos com sucesso!');

    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast.error(`Erro ao limpar dados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAvailableRanges]);

  return {
    isLoading,
    availableRanges,
    fetchKaggleData,
    getMarketData,
    refreshAvailableRanges,
    clearAllData
  };
};
