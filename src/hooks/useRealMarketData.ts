
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
      console.log('Fetching Kaggle data with params:', params);
      
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

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const message = data.source === 'cached-data' 
          ? `Dados encontrados no cache! ${data.tickCount} registros disponíveis.`
          : `Dados carregados com sucesso! ${data.tickCount} ticks importados.`;
        
        toast.success(message);
        await refreshAvailableRanges();
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao buscar dados');
      }

    } catch (error: any) {
      console.error('Error fetching Kaggle data:', error);
      toast.error(`Erro ao buscar dados: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMarketData = useCallback(async (params: GetMarketDataParams = {}) => {
    try {
      console.log('Getting market data with params:', params);
      
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

      const { data, error } = await supabase.functions.invoke('get-market-data?' + queryParams.toString());

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        console.log(`Successfully retrieved ${data.count} records`);
        return data.data || [];
      } else {
        console.warn('No data returned:', data?.error);
        if (data?.error?.includes('Nenhum dado encontrado')) {
          toast.warning('Nenhum dado encontrado para o período. Carregue os dados primeiro na aba "Dados".');
        }
        return [];
      }

    } catch (error: any) {
      console.error('Error getting market data:', error);
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
