
import { CandleData } from './advancedMarketGenerator';

export interface ReplayState {
  candles: CandleData[];
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  totalCandles: number;
  startTime: number;
  currentCandle: CandleData | null;
}

export interface ReplayCallbacks {
  onCandleUpdate: (candle: CandleData, index: number) => void;
  onReplayEnd: () => void;
  onProgress: (progress: number) => void;
}

export class ReplayEngine {
  private state: ReplayState;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ReplayCallbacks;

  constructor(candles: CandleData[], callbacks: ReplayCallbacks) {
    this.state = {
      candles: [...candles].sort((a, b) => a.time - b.time),
      currentIndex: -1,
      isPlaying: false,
      isPaused: false,
      speed: 1,
      totalCandles: candles.length,
      startTime: Date.now(),
      currentCandle: null
    };
    this.callbacks = callbacks;
  }

  getState(): ReplayState {
    return { ...this.state };
  }

  start(speed: number = 1): void {
    if (this.state.isPlaying && !this.state.isPaused) return;

    this.state.speed = speed;
    this.state.isPlaying = true;
    this.state.isPaused = false;

    console.log('🎬 Replay Engine: Starting replay', {
      speed,
      totalCandles: this.state.totalCandles,
      currentIndex: this.state.currentIndex
    });

    this.scheduleNext();
  }

  pause(): void {
    this.state.isPaused = true;
    this.clearInterval();
    console.log('⏸️ Replay Engine: Paused at index', this.state.currentIndex);
  }

  resume(): void {
    if (!this.state.isPlaying) return;
    
    this.state.isPaused = false;
    this.scheduleNext();
    console.log('▶️ Replay Engine: Resumed from index', this.state.currentIndex);
  }

  stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.clearInterval();
    console.log('⏹️ Replay Engine: Stopped');
  }

  reset(): void {
    this.stop();
    this.state.currentIndex = -1;
    this.state.currentCandle = null;
    console.log('🔄 Replay Engine: Reset');
  }

  jumpTo(index: number): void {
    if (index < 0 || index >= this.state.totalCandles) return;

    const wasPlaying = this.state.isPlaying && !this.state.isPaused;
    this.pause();

    this.state.currentIndex = index;
    this.state.currentCandle = this.state.candles[index];
    
    this.callbacks.onCandleUpdate(this.state.currentCandle, index);
    this.updateProgress();

    if (wasPlaying) {
      this.resume();
    }

    console.log('⏭️ Replay Engine: Jumped to index', index);
  }

  setSpeed(speed: number): void {
    this.state.speed = speed;
    
    if (this.state.isPlaying && !this.state.isPaused) {
      this.clearInterval();
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const intervalTime = Math.max(50, 1000 / this.state.speed); // Mínimo 50ms
    
    this.intervalId = setTimeout(() => {
      this.advance();
    }, intervalTime);
  }

  private advance(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    this.state.currentIndex++;

    if (this.state.currentIndex >= this.state.totalCandles) {
      this.state.isPlaying = false;
      this.callbacks.onReplayEnd();
      console.log('🏁 Replay Engine: Replay finished');
      return;
    }

    this.state.currentCandle = this.state.candles[this.state.currentIndex];
    this.callbacks.onCandleUpdate(this.state.currentCandle, this.state.currentIndex);
    this.updateProgress();

    this.scheduleNext();
  }

  private updateProgress(): void {
    const progress = this.state.totalCandles > 0 
      ? ((this.state.currentIndex + 1) / this.state.totalCandles) * 100 
      : 0;
    this.callbacks.onProgress(progress);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.clearInterval();
  }
}
