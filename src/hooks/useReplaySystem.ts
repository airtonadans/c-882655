
import { useState, useRef, useCallback, useEffect } from 'react';
import { MarketDataGenerator, CandleData } from '../utils/marketDataGenerator';

export interface ReplaySystemState {
  isActive: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  data: CandleData[];
  speed: number;
  progress: number;
  currentCandle: CandleData | null;
  totalCandles: number;
}

export const useReplaySystem = () => {
  const [state, setState] = useState<ReplaySystemState>({
    isActive: false,
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    data: [],
    speed: 1,
    progress: 0,
    currentCandle: null,
    totalCandles: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef<((candle: CandleData) => void) | null>(null);
  const generatorRef = useRef<MarketDataGenerator>(new MarketDataGenerator());

  const calculateInterval = (speed: number) => {
    return Math.max(50, 1000 / speed);
  };

  const startReplay = useCallback((startDate: string, endDate: string, speed: number) => {
    console.log('Iniciando replay avançado:', { startDate, endDate, speed });
    
    // Gerar dados sintéticos realistas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const syntheticData = generatorRef.current.generateCandleSequence(start, end, 60);

    if (syntheticData.length === 0) {
      console.log('Erro ao gerar dados sintéticos');
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      isPlaying: true,
      isPaused: false,
      currentIndex: 0,
      data: syntheticData,
      speed,
      totalCandles: syntheticData.length,
      currentCandle: syntheticData[0] || null,
      progress: 0
    }));

    // Iniciar reprodução
    let currentIndex = 0;
    intervalRef.current = setInterval(() => {
      currentIndex++;
      
      if (currentIndex < syntheticData.length) {
        const currentCandle = syntheticData[currentIndex];
        const progress = (currentIndex / syntheticData.length) * 100;
        
        setState(prev => ({
          ...prev,
          currentIndex,
          currentCandle,
          progress
        }));

        // Notificar callback
        if (onUpdateRef.current && currentCandle) {
          onUpdateRef.current(currentCandle);
        }
      } else {
        // Replay finalizado
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          progress: 100
        }));
        console.log('Replay concluído');
      }
    }, calculateInterval(speed));
  }, []);

  const pauseReplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => {
      const newPaused = !prev.isPaused;
      
      // Se vai continuar (não pausado), reiniciar intervalo
      if (!newPaused && prev.isPlaying) {
        let currentIndex = prev.currentIndex;
        
        intervalRef.current = setInterval(() => {
          currentIndex++;
          
          if (currentIndex < prev.data.length) {
            const currentCandle = prev.data[currentIndex];
            const progress = (currentIndex / prev.data.length) * 100;
            
            setState(current => ({
              ...current,
              currentIndex,
              currentCandle,
              progress
            }));

            if (onUpdateRef.current && currentCandle) {
              onUpdateRef.current(currentCandle);
            }
          } else {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setState(current => ({
              ...current,
              isPlaying: false,
              isPaused: false,
              progress: 100
            }));
          }
        }, calculateInterval(prev.speed));
      }
      
      return { ...prev, isPaused: newPaused };
    });
  }, []);

  const stopReplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      progress: 0,
      currentCandle: prev.data[0] || null
    }));
  }, []);

  const resetReplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState({
      isActive: false,
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      data: [],
      speed: 1,
      progress: 0,
      currentCandle: null,
      totalCandles: 0
    });
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    setState(prev => ({ ...prev, speed: newSpeed }));
    
    // Se estiver reproduzindo, reiniciar com nova velocidade
    if (state.isPlaying && !state.isPaused && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      let currentIndex = state.currentIndex;
      intervalRef.current = setInterval(() => {
        currentIndex++;
        
        if (currentIndex < state.data.length) {
          const currentCandle = state.data[currentIndex];
          const progress = (currentIndex / state.data.length) * 100;
          
          setState(current => ({
            ...current,
            currentIndex,
            currentCandle,
            progress
          }));

          if (onUpdateRef.current && currentCandle) {
            onUpdateRef.current(currentCandle);
          }
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setState(current => ({
            ...current,
            isPlaying: false,
            isPaused: false,
            progress: 100
          }));
        }
      }, calculateInterval(newSpeed));
    }
  }, [state.isPlaying, state.isPaused, state.currentIndex, state.data]);

  const jumpToPosition = useCallback((position: number) => {
    if (position < 0 || position >= state.data.length) return;
    
    const currentCandle = state.data[position];
    const progress = (position / state.data.length) * 100;
    
    setState(prev => ({
      ...prev,
      currentIndex: position,
      currentCandle,
      progress
    }));

    if (onUpdateRef.current && currentCandle) {
      onUpdateRef.current(currentCandle);
    }
  }, [state.data]);

  const setOnCandleUpdate = useCallback((callback: (candle: CandleData) => void) => {
    onUpdateRef.current = callback;
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    changeSpeed,
    jumpToPosition,
    setOnCandleUpdate
  };
};
