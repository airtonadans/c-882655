
import { CandleData } from './advancedMarketGenerator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NormalizedCandle extends CandleData {
  isNormalized?: boolean;
  originalData?: Partial<CandleData>;
}

export class DataValidator {
  static validateCandle(candle: CandleData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if (!candle.time || candle.time <= 0) {
      errors.push('Timestamp inválido');
    }

    if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
      errors.push('Preços devem ser positivos');
    }

    if (candle.volume < 0) {
      errors.push('Volume não pode ser negativo');
    }

    // Validações de lógica OHLC
    if (candle.high < Math.max(candle.open, candle.close)) {
      errors.push('High deve ser >= max(open, close)');
    }

    if (candle.low > Math.min(candle.open, candle.close)) {
      errors.push('Low deve ser <= min(open, close)');
    }

    // Validações de spread excessivo
    const spread = candle.high - candle.low;
    const avgPrice = (candle.open + candle.close) / 2;
    const spreadPercent = (spread / avgPrice) * 100;

    if (spreadPercent > 10) {
      warnings.push(`Spread muito alto: ${spreadPercent.toFixed(2)}%`);
    }

    // Validação de gap entre open e close anterior seria feita no conjunto de dados

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateCandleSequence(candles: CandleData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (candles.length === 0) {
      errors.push('Array de candles está vazio');
      return { isValid: false, errors, warnings };
    }

    // Verificar ordem temporal
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].time <= candles[i - 1].time) {
        errors.push(`Candle ${i} não está em ordem cronológica`);
      }
    }

    // Verificar gaps excessivos
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const gap = Math.abs(curr.open - prev.close);
      const avgPrice = (prev.close + curr.open) / 2;
      const gapPercent = (gap / avgPrice) * 100;

      if (gapPercent > 5) {
        warnings.push(`Gap excessivo entre candle ${i - 1} e ${i}: ${gapPercent.toFixed(2)}%`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export class DataNormalizer {
  static normalizeCandle(candle: CandleData): NormalizedCandle {
    const normalized: NormalizedCandle = { ...candle };
    let wasModified = false;

    // Corrigir preços negativos ou zero
    if (normalized.open <= 0) {
      normalized.open = Math.max(normalized.high, normalized.close) * 0.99;
      wasModified = true;
    }
    if (normalized.high <= 0) {
      normalized.high = Math.max(normalized.open, normalized.close) * 1.01;
      wasModified = true;
    }
    if (normalized.low <= 0) {
      normalized.low = Math.min(normalized.open, normalized.close) * 0.99;
      wasModified = true;
    }
    if (normalized.close <= 0) {
      normalized.close = normalized.open;
      wasModified = true;
    }

    // Corrigir lógica OHLC
    const maxOC = Math.max(normalized.open, normalized.close);
    const minOC = Math.min(normalized.open, normalized.close);

    if (normalized.high < maxOC) {
      normalized.high = maxOC;
      wasModified = true;
    }

    if (normalized.low > minOC) {
      normalized.low = minOC;
      wasModified = true;
    }

    // Corrigir volume negativo
    if (normalized.volume < 0) {
      normalized.volume = 0;
      wasModified = true;
    }

    if (wasModified) {
      normalized.isNormalized = true;
      normalized.originalData = { ...candle };
    }

    return normalized;
  }

  static normalizeCandleSequence(candles: CandleData[]): NormalizedCandle[] {
    if (candles.length === 0) return [];

    // Primeiro, normalizar candles individuais
    let normalized = candles.map(candle => this.normalizeCandle(candle));

    // Ordenar por timestamp
    normalized = normalized.sort((a, b) => a.time - b.time);

    // Preencher gaps se necessário
    normalized = this.fillGaps(normalized);

    return normalized;
  }

  private static fillGaps(candles: NormalizedCandle[], maxGapSeconds: number = 600): NormalizedCandle[] {
    if (candles.length <= 1) return candles;

    const result: NormalizedCandle[] = [candles[0]];

    for (let i = 1; i < candles.length; i++) {
      const prev = result[result.length - 1];
      const curr = candles[i];
      const gap = curr.time - prev.time;

      if (gap > maxGapSeconds) {
        // Criar candles intermediários
        const numberOfFillCandles = Math.floor(gap / 300) - 1; // Assumindo 5min candles
        
        for (let j = 1; j <= numberOfFillCandles; j++) {
          const fillTime = prev.time + (j * 300);
          const fillCandle: NormalizedCandle = {
            time: fillTime,
            open: prev.close,
            high: prev.close,
            low: prev.close,
            close: prev.close,
            volume: 0,
            isNormalized: true,
            originalData: undefined
          };
          result.push(fillCandle);
        }
      }

      result.push(curr);
    }

    return result;
  }
}
