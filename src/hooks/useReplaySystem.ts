
import { useState, useCallback, useRef, useEffect } from 'react';
import { CandleData } from '../utils/advancedMarketGenerator';
import { generateAdvancedMarketData } from '../utils/advancedMarketGenerator';

export interface ReplayState {
  data: CandleData[];
  currentIndex: number;
  totalCandles: number;
  isPlaying: boolean;
  isPaused: boolean;
  isActive: boolean;
  speed: number;
  progress: number;
  currentCandle: CandleData | null;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  marketPhase: 'trending' | 'consolidation' | 'volatile';
}

export const useReplaySystem = () => {
  const [state, setState] = useState<ReplayState>({
    data: [],
    currentIndex: -1,
    totalCandles: 0,
    isPlaying: false,
    isPaused: false,
    isActive: false,
    speed: 1,
    progress: 0,
    currentCandle: null,
    marketSentiment: 'neutral',
    marketPhase: 'consolidation'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCandleUpdateRef = useRef<((candle: CandleData, index: number) => void) | null>(null);

  const generateNewScenario = useCallback(() => {
    console.log('Generating new market scenario...');
    const newData = generateAdvancedMarketData();
    
    setState(prev => ({
      ...prev,
      data: newData,
      totalCandles: newData.length,
      currentIndex: -1,
      progress: 0,
      isActive: true,
      currentCandle: null
    }));
  }, []);

  const loadRealData = useCallback((realData: any[]) => {
    console.log('Loading real data into replay system:', realData.length, 'records');
    
    // Convert real data format to CandleData format
    const convertedData: CandleData[] = realData.map((item, index) => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume || 0
    }));

    setState(prev => ({
      ...prev,
      data: convertedData,
      totalCandles: convertedData.length,
      currentIndex: -1,
      progress: 0,
      isActive: true,
      currentCandle: null,
      marketSentiment: 'neutral',
      marketPhase: 'trending'
    }));
  }, []);

  const startReplay = useCallback(() => {
    if (state.data.length === 0) {
      generateNewScenario();
      return;
    }

    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.currentIndex >= prev.totalCandles - 1) {
          return { ...prev, isPlaying: false };
        }

        const nextIndex = prev.currentIndex + 1;
        const nextCandle = prev.data[nextIndex];
        const progress = ((nextIndex + 1) / prev.totalCandles) * 100;

        // Determine market sentiment based on price movement
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (nextCandle && nextIndex > 0) {
          const prevCandle = prev.data[nextIndex - 1];
          if (nextCandle.close > prevCandle.close) {
            sentiment = 'bullish';
          } else if (nextCandle.close < prevCandle.close) {
            sentiment = 'bearish';
          }
        }

        // Call the update callback if it exists
        if (onCandleUpdateRef.current && nextCandle) {
          onCandleUpdateRef.current(nextCandle, nextIndex);
        }

        return {
          ...prev,
          currentIndex: nextIndex,
          progress,
          currentCandle: nextCandle,
          marketSentiment: sentiment
        };
      });
    }, Math.max(50, 1000 / state.speed));
  }, [state.data.length, state.speed, generateNewScenario]);

  const pauseReplay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopReplay = useCallback(() => {
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
    stopReplay();
    generateNewScenario();
  }, [stopReplay, generateNewScenario]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setState(prev => ({ ...prev, speed: newSpeed }));
    
    if (state.isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.currentIndex >= prev.totalCandles - 1) {
            return { ...prev, isPlaying: false };
          }

          const nextIndex = prev.currentIndex + 1;
          const nextCandle = prev.data[nextIndex];
          const progress = ((nextIndex + 1) / prev.totalCandles) * 100;

          if (onCandleUpdateRef.current && nextCandle) {
            onCandleUpdateRef.current(nextCandle, nextIndex);
          }

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

  const setOnCandleUpdate = useCallback((callback: (candle: CandleData, index: number) => void) => {
    onCandleUpdateRef.current = callback;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Initialize with generated data if empty
  useEffect(() => {
    if (state.data.length === 0) {
      generateNewScenario();
    }
  }, []);

  return {
    state,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    changeSpeed,
    setOnCandleUpdate,
    generateNewScenario,
    loadRealData
  };
};
