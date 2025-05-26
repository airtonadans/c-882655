
import { useState, useRef, useCallback } from 'react';
import mockCandleData from '../data/mockCandleData.json';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
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
    return Math.max(100, 1000 / speed); // Mínimo de 100ms, máximo de 1000ms
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

    // Iniciar reprodução
    let currentIndex = 0;
    intervalRef.current = setInterval(() => {
      currentIndex++;
      
      if (currentIndex <= filteredData.length) {
        setReplayState(prev => ({
          ...prev,
          currentIndex: currentIndex,
        }));

        // Notificar callback se houver
        if (onCandleUpdateRef.current && currentIndex <= filteredData.length) {
          const currentCandle = filteredData[currentIndex - 1];
          if (currentCandle) {
            onCandleUpdateRef.current(currentCandle);
          }
        }

        console.log(`Reproduzindo candle ${currentIndex}/${filteredData.length}`);
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
    
    setReplayState(prev => {
      const newPaused = !prev.isPaused;
      
      // Se estava pausado e agora vai continuar, reiniciar o intervalo
      if (!newPaused && prev.isPlaying) {
        let currentIndex = prev.currentIndex;
        const speed = prev.speed;
        const data = prev.data;
        
        intervalRef.current = setInterval(() => {
          currentIndex++;
          
          if (currentIndex <= data.length) {
            setReplayState(current => ({
              ...current,
              currentIndex: currentIndex,
            }));

            // Notificar callback se houver
            if (onCandleUpdateRef.current && currentIndex <= data.length) {
              const currentCandle = data[currentIndex - 1];
              if (currentCandle) {
                onCandleUpdateRef.current(currentCandle);
              }
            }
          } else {
            // Replay finalizado
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setReplayState(current => ({
              ...current,
              isPlaying: false,
              isPaused: false,
            }));
          }
        }, calculateSpeed(speed));
      }
      
      return {
        ...prev,
        isPaused: newPaused,
      };
    });
    
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setReplayState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
    }));
    console.log('Replay resetado');
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    setReplayState(prev => ({
      ...prev,
      speed: newSpeed
    }));
    
    // Se estiver reproduzindo e não pausado, reiniciar com nova velocidade
    if (replayState.isPlaying && !replayState.isPaused && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      let currentIndex = replayState.currentIndex;
      const data = replayState.data;
      
      intervalRef.current = setInterval(() => {
        currentIndex++;
        
        if (currentIndex <= data.length) {
          setReplayState(current => ({
            ...current,
            currentIndex: currentIndex,
          }));

          if (onCandleUpdateRef.current && currentIndex <= data.length) {
            const currentCandle = data[currentIndex - 1];
            if (currentCandle) {
              onCandleUpdateRef.current(currentCandle);
            }
          }
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setReplayState(current => ({
            ...current,
            isPlaying: false,
            isPaused: false,
          }));
        }
      }, calculateSpeed(newSpeed));
    }
  }, [replayState.isPlaying, replayState.isPaused, replayState.currentIndex, replayState.data]);

  const jumpToPosition = useCallback((position: number) => {
    if (position < 0 || position > replayState.data.length) return;
    
    setReplayState(prev => ({
      ...prev,
      currentIndex: position,
    }));

    // Atualizar o callback com o candle na posição
    if (onCandleUpdateRef.current && replayState.data[position - 1]) {
      onCandleUpdateRef.current(replayState.data[position - 1]);
    }
  }, [replayState.data]);

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
    changeSpeed,
    jumpToPosition,
  };
};
