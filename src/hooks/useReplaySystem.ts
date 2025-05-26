import { useState, useRef, useCallback, useEffect } from 'react';
import { AdvancedMarketGenerator, CandleData } from '../utils/advancedMarketGenerator';

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
  marketSentiment: string;
  marketPhase: string;
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
    totalCandles: 0,
    marketSentiment: 'sideways',
    marketPhase: 'opening'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef<((candle: CandleData) => void) | null>(null);
  const generatorRef = useRef<AdvancedMarketGenerator>(new AdvancedMarketGenerator());

  const calculateInterval = (speed: number) => {
    return Math.max(50, 1000 / speed);
  };

  const generateNewScenario = useCallback(() => {
    console.log('Gerando novo cenário de mercado...');
    
    // Parar qualquer replay em andamento
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Gerar novo cenário
    generatorRef.current.generateNewScenario();
    const newData = generatorRef.current.generateTradingSession(5); // 5 minutos por candle
    
    setState(prev => ({
      ...prev,
      isActive: false,
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      data: newData,
      totalCandles: newData.length,
      currentCandle: newData[0] || null,
      progress: 0,
      marketSentiment: generatorRef.current.getCurrentSentiment(),
      marketPhase: generatorRef.current.getCurrentPhase()
    }));
    
    console.log(`Novo cenário gerado com ${newData.length} candles`);
    console.log(`Sentimento: ${generatorRef.current.getCurrentSentiment()}`);
    console.log(`Fase: ${generatorRef.current.getCurrentPhase()}`);
  }, []);

  const startReplay = useCallback((speed: number) => {
    console.log('Iniciando replay com velocidade:', speed);
    
    // Se não há dados, gerar novo cenário primeiro
    if (state.data.length === 0) {
      console.log('Gerando cenário antes de iniciar replay...');
      const newData = generatorRef.current.generateTradingSession(5);
      setState(prev => ({
        ...prev,
        data: newData,
        totalCandles: newData.length,
        currentCandle: newData[0] || null,
        marketSentiment: generatorRef.current.getCurrentSentiment(),
        marketPhase: generatorRef.current.getCurrentPhase()
      }));
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      isPlaying: true,
      isPaused: false,
      speed,
      currentIndex: prev.currentIndex || 0
    }));

    // Iniciar reprodução
    let currentIndex = state.currentIndex || 0;
    const dataToUse = state.data.length > 0 ? state.data : generatorRef.current.generateTradingSession(5);
    
    intervalRef.current = setInterval(() => {
      currentIndex++;
      
      if (currentIndex < dataToUse.length) {
        const currentCandle = dataToUse[currentIndex];
        const progress = (currentIndex / dataToUse.length) * 100;
        
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
  }, [state.data, state.currentIndex]);

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
      totalCandles: 0,
      marketSentiment: 'sideways',
      marketPhase: 'opening'
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
    setOnCandleUpdate,
    generateNewScenario
  };
};
