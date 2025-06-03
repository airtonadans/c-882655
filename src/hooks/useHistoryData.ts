
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
      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        throw new Error('A data de início deve ser anterior à data de fim');
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`Loading ${diffDays} days of historical data`);
      
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe,
        startDate,
        endDate,
        limit: 10000 // Higher limit for historical view
      });

      console.log(`Received ${data.length} records for history view`);

      if (data && data.length > 0) {
        const convertedData: CandleData[] = data.map(item => ({
          time: item.time || (new Date(item.timestamp).getTime() / 1000),
          open: parseFloat(item.open.toString()),
          high: parseFloat(item.high.toString()),
          low: parseFloat(item.low.toString()),
          close: parseFloat(item.close.toString()),
          volume: item.volume || 0
        }));

        console.log(`Converted ${convertedData.length} candles for history view`);

        setState({
          data: convertedData,
          totalCandles: convertedData.length,
          isLoaded: true
        });

        return convertedData;
      } else {
        throw new Error(`Nenhum dado encontrado para o período ${startDate} a ${endDate}. Verifique se os dados foram carregados na aba Dados.`);
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
    console.log('Clearing history data');
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
