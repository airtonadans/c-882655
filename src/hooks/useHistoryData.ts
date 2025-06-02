
import { useState, useCallback } from 'react';
import { useRealMarketData } from './useRealMarketData';
import { CandleData } from '../utils/advancedMarketGenerator';

export interface HistoryDataState {
  data: CandleData[];
  totalCandles: number;
  isLoaded: boolean;
}

export const useHistoryData = () => {
  const [state, setState] = useState<HistoryDataState>({
    data: [],
    totalCandles: 0,
    isLoaded: false
  });

  const { getMarketData, isLoading } = useRealMarketData();

  const loadHistoryData = useCallback(async (startDate: string, endDate: string, timeframe: string) => {
    console.log('Loading history data:', { startDate, endDate, timeframe });
    
    try {
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe,
        startDate,
        endDate,
        limit: 10000 // Maior limite para histórico completo
      });

      if (data && data.length > 0) {
        const convertedData: CandleData[] = data.map(item => ({
          time: new Date(item.timestamp).getTime() / 1000,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: item.volume || 0
        }));

        setState({
          data: convertedData,
          totalCandles: convertedData.length,
          isLoaded: true
        });

        return convertedData;
      } else {
        throw new Error('Nenhum dado encontrado para o período selecionado');
      }
    } catch (error) {
      console.error('Error loading history data:', error);
      setState({
        data: [],
        totalCandles: 0,
        isLoaded: false
      });
      throw error;
    }
  }, [getMarketData]);

  const clearHistoryData = useCallback(() => {
    setState({
      data: [],
      totalCandles: 0,
      isLoaded: false
    });
  }, []);

  return {
    state,
    isLoading,
    loadHistoryData,
    clearHistoryData
  };
};
