
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MarketPhase = 'opening' | 'morning_trend' | 'midday_consolidation' | 'afternoon_trend' | 'closing';
export type MarketSentiment = 'bullish' | 'bearish' | 'sideways' | 'volatile';

class NoiseGenerator {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed || Math.random();
  }
  
  // Implementação simplificada do ruído de Perlin
  perlinNoise(x: number): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    
    const a = this.noise(intX);
    const b = this.noise(intX + 1);
    
    return this.interpolate(a, b, fracX);
  }
  
  private noise(x: number): number {
    x = (x << 13) ^ x;
    return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
  }
  
  private interpolate(a: number, b: number, x: number): number {
    const ft = x * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }
}

export class AdvancedMarketGenerator {
  private currentPrice: number;
  private basePrice: number;
  private sentiment: MarketSentiment;
  private phase: MarketPhase = 'opening';
  private noiseGen: NoiseGenerator;
  private trendStrength: number = 0.5;
  private volatilityLevel: number = 0.02;
  private sessionStart: Date;
  private candleIndex: number = 0;
  
  constructor(initialPrice: number = 50000) {
    this.basePrice = initialPrice;
    this.currentPrice = initialPrice;
    this.noiseGen = new NoiseGenerator();
    this.sentiment = this.generateInitialSentiment();
    this.sessionStart = new Date();
    this.sessionStart.setHours(9, 0, 0, 0); // Simula início do pregão às 9h
  }
  
  generateTradingSession(intervalMinutes: number = 5): CandleData[] {
    const candles: CandleData[] = [];
    const totalMinutes = 8 * 60; // 8 horas de pregão
    const totalCandles = Math.floor(totalMinutes / intervalMinutes);
    
    this.candleIndex = 0;
    let currentTime = new Date(this.sessionStart);
    
    for (let i = 0; i < totalCandles; i++) {
      // Determinar fase do mercado baseada no horário
      this.updateMarketPhase(i, totalCandles);
      
      // Gerar candle com comportamento específico da fase
      const candle = this.generateRealisticCandle(
        Math.floor(currentTime.getTime() / 1000),
        i,
        totalCandles
      );
      
      candles.push(candle);
      this.candleIndex++;
      
      // Avançar tempo
      currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
      
      // Ocasionalmente mudar sentimento do mercado
      if (Math.random() < 0.03) { // 3% chance por candle
        this.changeSentiment();
      }
    }
    
    return candles;
  }
  
  private generateInitialSentiment(): MarketSentiment {
    const sentiments: MarketSentiment[] = ['bullish', 'bearish', 'sideways', 'volatile'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }
  
  private updateMarketPhase(candleIndex: number, totalCandles: number) {
    const progress = candleIndex / totalCandles;
    
    if (progress < 0.1) this.phase = 'opening';
    else if (progress < 0.4) this.phase = 'morning_trend';
    else if (progress < 0.6) this.phase = 'midday_consolidation';
    else if (progress < 0.9) this.phase = 'afternoon_trend';
    else this.phase = 'closing';
  }
  
  private generateRealisticCandle(timestamp: number, index: number, totalCandles: number): CandleData {
    const open = this.currentPrice;
    
    // Calcular movimento base usando ruído de Perlin e sentimento
    const noiseValue = this.noiseGen.perlinNoise(index * 0.1);
    const sentimentMovement = this.getSentimentMovement();
    const phaseMovement = this.getPhaseMovement();
    
    // Combinar movimentos
    const totalMovement = (sentimentMovement + phaseMovement + noiseValue * 0.3) * this.basePrice * this.volatilityLevel;
    
    let close = open + totalMovement;
    
    // Garantir que não haja movimentos extremos
    const maxMove = this.basePrice * 0.05; // Máximo 5% por candle
    close = Math.max(open - maxMove, Math.min(open + maxMove, close));
    
    // Gerar high e low realistas
    const candleRange = Math.abs(close - open);
    const extraRange = candleRange * (0.5 + Math.random() * 1.5);
    
    const high = Math.max(open, close) + extraRange * (0.3 + Math.random() * 0.7);
    const low = Math.min(open, close) - extraRange * (0.2 + Math.random() * 0.5);
    
    // Gerar volume realista baseado na volatilidade e fase
    const volume = this.generateRealisticVolume(Math.abs(close - open), candleRange);
    
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
  
  private getSentimentMovement(): number {
    const baseMovement = 0.001; // 0.1% movimento base
    
    switch (this.sentiment) {
      case 'bullish':
        return baseMovement * this.trendStrength * (0.7 + Math.random() * 0.6);
      case 'bearish':
        return -baseMovement * this.trendStrength * (0.7 + Math.random() * 0.6);
      case 'sideways':
        return baseMovement * (Math.random() - 0.5) * 0.3;
      case 'volatile':
        return baseMovement * (Math.random() - 0.5) * 2.5;
      default:
        return 0;
    }
  }
  
  private getPhaseMovement(): number {
    const baseMovement = 0.0005;
    
    switch (this.phase) {
      case 'opening':
        // Abertura pode ser volátil
        return baseMovement * (Math.random() - 0.5) * 2;
      case 'morning_trend':
        // Manhã tende a ter direção
        return baseMovement * (this.sentiment === 'bullish' ? 1 : this.sentiment === 'bearish' ? -1 : 0);
      case 'midday_consolidation':
        // Meio do dia mais lateral
        return baseMovement * (Math.random() - 0.5) * 0.5;
      case 'afternoon_trend':
        // Tarde pode retomar tendência
        return baseMovement * (this.sentiment === 'bullish' ? 0.8 : this.sentiment === 'bearish' ? -0.8 : 0);
      case 'closing':
        // Fechamento pode ter ajustes
        return baseMovement * (Math.random() - 0.5) * 1.5;
      default:
        return 0;
    }
  }
  
  private generateRealisticVolume(priceMovement: number, candleRange: number): number {
    const baseVolume = 1000000;
    
    // Volume maior em candles com mais movimento
    const movementFactor = 1 + (priceMovement / this.basePrice) * 50;
    
    // Volume maior em determinadas fases
    const phaseFactor = this.getPhaseVolumeFactor();
    
    // Ruído no volume
    const volumeNoise = 0.7 + Math.random() * 0.6;
    
    return baseVolume * movementFactor * phaseFactor * volumeNoise;
  }
  
  private getPhaseVolumeFactor(): number {
    switch (this.phase) {
      case 'opening': return 1.8; // Abertura tem mais volume
      case 'morning_trend': return 1.4;
      case 'midday_consolidation': return 0.7; // Meio dia menos volume
      case 'afternoon_trend': return 1.3;
      case 'closing': return 1.6; // Fechamento tem mais volume
      default: return 1;
    }
  }
  
  private changeSentiment(): void {
    const sentiments: MarketSentiment[] = ['bullish', 'bearish', 'sideways', 'volatile'];
    const currentIndex = sentiments.indexOf(this.sentiment);
    
    // Evitar mudanças muito bruscas - prefere sentimentos próximos
    let newSentiment: MarketSentiment;
    if (Math.random() < 0.6) {
      // 60% chance de mudança gradual
      const adjacent = currentIndex === 0 ? [1, 2] : 
                      currentIndex === 1 ? [0, 3] :
                      currentIndex === 2 ? [0, 3] : [1, 2];
      newSentiment = sentiments[adjacent[Math.floor(Math.random() * adjacent.length)]];
    } else {
      // 40% chance de mudança aleatória
      newSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    }
    
    this.sentiment = newSentiment;
    this.trendStrength = 0.3 + Math.random() * 0.7;
    this.volatilityLevel = 0.01 + Math.random() * 0.04;
  }
  
  // Método para gerar novo cenário
  generateNewScenario(): void {
    // Reset para novo pregão
    this.currentPrice = this.basePrice * (0.95 + Math.random() * 0.1); // ±5% do preço base
    this.basePrice = this.currentPrice;
    this.sentiment = this.generateInitialSentiment();
    this.phase = 'opening';
    this.candleIndex = 0;
    this.trendStrength = 0.3 + Math.random() * 0.7;
    this.volatilityLevel = 0.015 + Math.random() * 0.03;
    this.noiseGen = new NoiseGenerator(); // Novo seed para ruído
    
    // Nova data de sessão
    this.sessionStart = new Date();
    this.sessionStart.setHours(9, 0, 0, 0);
  }
  
  getCurrentSentiment(): MarketSentiment {
    return this.sentiment;
  }
  
  getCurrentPhase(): MarketPhase {
    return this.phase;
  }
}
