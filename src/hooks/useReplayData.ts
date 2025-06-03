import { useState, useCallback, useRef, useEffect } from 'react';
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadReplayData = useCallback(async (date: string, timeframe: string) => {
    console.log('Loading replay data for date:', date, 'timeframe:', timeframe);
    
    try {
      const startDate = date;
      const endDate = date;
      
      console.log(`Fetching replay data from ${startDate} to ${endDate}`);
      
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe,
        startDate,
        endDate,
        limit: 500
      });

      console.log(`Received ${data.length} records for replay`);

      if (data && data.length > 0) {
        // Validate and convert data
        const convertedData: CandleData[] = data
          .filter(item => {
            // Validate required fields
            const hasRequiredFields = item.time && item.open && item.high && item.low && item.close;
            const hasValidNumbers = 
              !isNaN(parseFloat(item.open.toString())) &&
              !isNaN(parseFloat(item.high.toString())) &&
              !isNaN(parseFloat(item.low.toString())) &&
              !isNaN(parseFloat(item.close.toString()));
            
            if (!hasRequiredFields || !hasValidNumbers) {
              console.warn('Invalid data item:', item);
              return false;
            }
            return true;
          })
          .map(item => {
            const timestamp = item.time || (new Date(item.timestamp).getTime() / 1000);
            
            return {
              time: timestamp,
              open: parseFloat(item.open.toString()),
              high: parseFloat(item.high.toString()),
              low: parseFloat(item.low.toString()),
              close: parseFloat(item.close.toString()),
              volume: item.volume || 0
            };
          })
          .sort((a, b) => a.time - b.time); // Ensure chronological order

        console.log(`Converted and validated ${convertedData.length} candles for replay`);
        console.log('Sample data:', convertedData.slice(0, 3));

        if (convertedData.length === 0) {
          throw new Error(`Nenhum dado válido encontrado para ${date}.`);
        }

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
        throw new Error(`Nenhum dado encontrado para ${date}. Verifique se os dados foram carregados na aba Dados.`);
      }
    } catch (error) {
      console.error('Error loading replay data:', error);
      setState(prev => ({
        ...prev,
        data: [],
        totalCandles: 0,
        currentIndex: -1,
        progress: 0,
        currentCandle: null,
        isPlaying: false,
        isPaused: false
      }));
      throw error;
    }
  }, [getMarketData]);

  const startReplay = useCallback((speed: number) => {
    if (state.data.length === 0) {
      console.warn('No data available for replay');
      return;
    }

    console.log(`Starting replay with ${state.data.length} candles at ${speed}x speed`);

    setState(prev => ({ ...prev, isPlaying: true, isPaused: false, speed }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.currentIndex >= prev.totalCandles - 1) {
          console.log('Replay completed');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
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
  }, [state.data.length]);

  const pauseReplay = useCallback(() => {
    console.log('Pausing replay');
    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopReplay = useCallback(() => {
    console.log('Stopping replay');
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentIndex: -1,
      progress: 0,
      currentCandle: null
    }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetReplay = useCallback(() => {
    console.log('Resetting replay');
    stopReplay();
  }, [stopReplay]);

  const changeSpeed = useCallback((newSpeed: number) => {
    console.log(`Changing replay speed to ${newSpeed}x`);
    setState(prev => ({ ...prev, speed: newSpeed }));
    
    if (state.isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.currentIndex >= prev.totalCandles - 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
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
  }, [state.isPlaying]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
