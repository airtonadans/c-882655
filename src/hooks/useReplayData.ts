
import { useState, useCallback } from 'react';
import { useRealMarketData } from './useRealMarketData';
import { CandleData } from '../utils/advancedMarketGenerator';

export interface ReplayDataState {
  data: CandleData[];
  currentIndex: number;
  totalCandles: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  progress: number;
  currentCandle: CandleData | null;
}

export const useReplayData = () => {
  const [state, setState] = useState<ReplayDataState>({
    data: [],
    currentIndex: -1,
    totalCandles: 0,
    isPlaying: false,
    isPaused: false,
    speed: 1,
    progress: 0,
    currentCandle: null
  });

  const { getMarketData, isLoading } = useRealMarketData();
  const intervalRef = useState<NodeJS.Timeout | null>(null)[0];

  const loadReplayData = useCallback(async (date: string, timeframe: string) => {
    console.log('Loading replay data for date:', date, 'timeframe:', timeframe);
    
    try {
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe,
        startDate: date,
        endDate: date,
        limit: 1000
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

        setState(prev => ({
          ...prev,
          data: convertedData,
          totalCandles: convertedData.length,
          currentIndex: -1,
          progress: 0,
          currentCandle: null,
          isPlaying: false,
          isPaused: false
        }));

        return convertedData;
      } else {
        throw new Error('Nenhum dado encontrado para a data selecionada');
      }
    } catch (error) {
      console.error('Error loading replay data:', error);
      throw error;
    }
  }, [getMarketData]);

  const startReplay = useCallback((speed: number) => {
    if (state.data.length === 0) return;

    setState(prev => ({ ...prev, isPlaying: true, isPaused: false, speed }));

    if (intervalRef) {
      clearInterval(intervalRef);
    }

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.currentIndex >= prev.totalCandles - 1) {
          clearInterval(interval);
          return { ...prev, isPlaying: false };
        }

        const nextIndex = prev.currentIndex + 1;
        const nextCandle = prev.data[nextIndex];
        const progress = ((nextIndex + 1) / prev.totalCandles) * 100;

        return {
          ...prev,
          currentIndex: nextIndex,
          progress,
          currentCandle: nextCandle
        };
      });
    }, Math.max(50, 1000 / speed));
  }, [state.data.length, intervalRef]);

  const pauseReplay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    if (intervalRef) {
      clearInterval(intervalRef);
    }
  }, [intervalRef]);

  const stopReplay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentIndex: -1,
      progress: 0,
      currentCandle: null
    }));
    if (intervalRef) {
      clearInterval(intervalRef);
    }
  }, [intervalRef]);

  const resetReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setState(prev => ({ ...prev, speed: newSpeed }));
    
    if (state.isPlaying && intervalRef) {
      clearInterval(intervalRef);
      
      const interval = setInterval(() => {
        setState(prev => {
          if (prev.currentIndex >= prev.totalCandles - 1) {
            clearInterval(interval);
            return { ...prev, isPlaying: false };
          }

          const nextIndex = prev.currentIndex + 1;
          const nextCandle = prev.data[nextIndex];
          const progress = ((nextIndex + 1) / prev.totalCandles) * 100;

          return {
            ...prev,
            currentIndex: nextIndex,
            progress,
            currentCandle: nextCandle
          };
        });
      }, Math.max(50, 1000 / newSpeed));
    }
  }, [state.isPlaying, intervalRef]);

  return {
    state,
    isLoading,
    loadReplayData,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    changeSpeed
  };
};
