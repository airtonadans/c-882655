
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MarketTrend = 'bullish' | 'bearish' | 'sideways';

export class MarketDataGenerator {
  private currentPrice: number;
  private trend: MarketTrend = 'sideways';
  private trendStrength: number = 0.5;
  private volatility: number = 0.02;

  constructor(initialPrice: number = 50000) {
    this.currentPrice = initialPrice;
  }

  generateCandleSequence(startDate: Date, endDate: Date, intervalMinutes: number = 60): CandleData[] {
    const candles: CandleData[] = [];
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const totalCandles = Math.floor(totalMinutes / intervalMinutes);

    let currentTime = new Date(startDate);
    
    for (let i = 0; i < totalCandles; i++) {
      // Mudar tendência ocasionalmente
      if (Math.random() < 0.05) {
        this.changeTrend();
      }

      const candle = this.generateCandle(Math.floor(currentTime.getTime() / 1000));
      candles.push(candle);
      
      currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    }

    return candles;
  }

  private generateCandle(timestamp: number): CandleData {
    const open = this.currentPrice;
    
    // Calcular movimento baseado na tendência
    const trendMovement = this.getTrendMovement();
    const randomMovement = (Math.random() - 0.5) * this.volatility * open;
    const totalMovement = trendMovement + randomMovement;
    
    let close = open + totalMovement;
    
    // Garantir que o preço não fique negativo
    close = Math.max(close, open * 0.8);
    
    // Gerar high e low realistas
    const candleRange = Math.abs(close - open);
    const extraRange = candleRange * (0.2 + Math.random() * 0.8);
    
    const high = Math.max(open, close) + extraRange;
    const low = Math.min(open, close) - extraRange * 0.7;
    
    // Volume realista (inversamente correlacionado com movimento)
    const priceChangePercent = Math.abs(close - open) / open;
    const baseVolume = 1000000;
    const volume = baseVolume * (1 + priceChangePercent * 5) * (0.5 + Math.random());

    this.currentPrice = close;

    return {
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(0))
    };
  }

  private getTrendMovement(): number {
    const baseMovement = this.currentPrice * 0.001; // 0.1% movimento base
    
    switch (this.trend) {
      case 'bullish':
        return baseMovement * this.trendStrength * (0.5 + Math.random() * 1.5);
      case 'bearish':
        return -baseMovement * this.trendStrength * (0.5 + Math.random() * 1.5);
      case 'sideways':
        return baseMovement * (Math.random() - 0.5) * 0.5;
      default:
        return 0;
    }
  }

  private changeTrend(): void {
    const trends: MarketTrend[] = ['bullish', 'bearish', 'sideways'];
    this.trend = trends[Math.floor(Math.random() * trends.length)];
    this.trendStrength = 0.3 + Math.random() * 0.7;
    this.volatility = 0.01 + Math.random() * 0.03;
  }
}
