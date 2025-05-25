
import { useState, useRef, useCallback } from 'react';
import mockCandleData from '../data/mockCandleData.json';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ReplayState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  data: CandleData[];
  speed: number;
}

export const useReplayMode = () => {
  const [replayState, setReplayState] = useState<ReplayState>({
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    data: [],
    speed: 1,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCandleUpdateRef = useRef<((candle: CandleData) => void) | null>(null);

  const calculateSpeed = (speed: number) => {
    return 1000 / speed; // 1x = 1000ms, 2x = 500ms, etc.
  };

  const startReplay = useCallback((startDate: string, endDate: string, speed: number) => {
    console.log('Iniciando replay:', { startDate, endDate, speed });
    
    // Filtrar dados pelo período selecionado
    const startTimestamp = new Date(startDate).getTime() / 1000;
    const endTimestamp = new Date(endDate).getTime() / 1000;
    
    const filteredData = mockCandleData.filter(
      (candle) => candle.time >= startTimestamp && candle.time <= endTimestamp
    );

    if (filteredData.length === 0) {
      console.log('Nenhum dado encontrado para o período selecionado');
      return;
    }

    setReplayState({
      isPlaying: true,
      isPaused: false,
      currentIndex: 0,
      data: filteredData,
      speed,
    });

    // Limpar gráfico antes de iniciar
    if (onCandleUpdateRef.current) {
      onCandleUpdateRef.current({ time: 0, open: 0, high: 0, low: 0, close: 0 });
    }

    // Iniciar reprodução
    let currentIndex = 0;
    intervalRef.current = setInterval(() => {
      if (currentIndex < filteredData.length) {
        const currentCandle = filteredData[currentIndex];
        console.log('Reproduzindo candle:', currentCandle);
        
        if (onCandleUpdateRef.current) {
          onCandleUpdateRef.current(currentCandle);
        }

        setReplayState(prev => ({
          ...prev,
          currentIndex: currentIndex + 1,
        }));

        currentIndex++;
      } else {
        // Replay finalizado
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setReplayState(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
        }));
        console.log('Replay finalizado');
      }
    }, calculateSpeed(speed));
  }, []);

  const pauseReplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setReplayState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
    console.log('Replay pausado/continuado');
  }, []);

  const stopReplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setReplayState({
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      data: [],
      speed: 1,
    });
    console.log('Replay parado');
  }, []);

  const resetReplay = useCallback(() => {
    stopReplay();
    // Limpar gráfico
    if (onCandleUpdateRef.current) {
      onCandleUpdateRef.current({ time: 0, open: 0, high: 0, low: 0, close: 0 });
    }
    console.log('Replay resetado');
  }, [stopReplay]);

  const setOnCandleUpdate = useCallback((callback: (candle: CandleData) => void) => {
    onCandleUpdateRef.current = callback;
  }, []);

  return {
    replayState,
    startReplay,
    pauseReplay,
    stopReplay,
    resetReplay,
    setOnCandleUpdate,
  };
};
