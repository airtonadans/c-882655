
import { CandleData } from './advancedMarketGenerator';

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  openPrice: number;
  closePrice?: number;
  openTime: number;
  closeTime?: number;
  quantity: number;
  pnl?: number;
  status: 'open' | 'closed';
}

export interface BacktestResult {
  trades: Trade[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  startBalance: number;
  endBalance: number;
  equity: number[];
}

export interface TradingSignal {
  action: 'buy' | 'sell' | 'hold';
  price: number;
  quantity: number;
  confidence: number;
  reason: string;
}

export interface BacktestConfig {
  initialBalance: number;
  commissionRate: number;
  slippageRate: number;
  maxPositionSize: number;
}

export abstract class TradingStrategy {
  abstract getName(): string;
  abstract generateSignal(candles: CandleData[], currentIndex: number): TradingSignal;
  abstract onTrade?(trade: Trade): void;
}

export class BacktestEngine {
  private config: BacktestConfig;
  private strategy: TradingStrategy;
  private trades: Trade[] = [];
  private openTrades: Trade[] = [];
  private balance: number;
  private equity: number[] = [];
  private maxEquity: number = 0;

  constructor(strategy: TradingStrategy, config: BacktestConfig) {
    this.strategy = strategy;
    this.config = config;
    this.balance = config.initialBalance;
    this.maxEquity = config.initialBalance;
  }

  runBacktest(candles: CandleData[]): BacktestResult {
    console.log('🚀 Backtest Engine: Starting backtest', {
      strategy: this.strategy.getName(),
      candles: candles.length,
      initialBalance: this.config.initialBalance
    });

    this.reset();

    // Processar cada candle
    for (let i = 0; i < candles.length; i++) {
      this.processCandleStep(candles, i);
    }

    // Fechar trades abertas
    this.closeAllOpenTrades(candles[candles.length - 1]);

    return this.calculateResults();
  }

  private reset(): void {
    this.trades = [];
    this.openTrades = [];
    this.balance = this.config.initialBalance;
    this.equity = [this.config.initialBalance];
    this.maxEquity = this.config.initialBalance;
  }

  private processCandleStep(candles: CandleData[], currentIndex: number): void {
    const currentCandle = candles[currentIndex];
    
    // Atualizar equity com posições abertas
    this.updateEquity(currentCandle);

    // Gerar sinal da estratégia
    const signal = this.strategy.generateSignal(candles, currentIndex);

    // Executar ação baseada no sinal
    if (signal.action === 'buy') {
      this.executeBuy(currentCandle, signal);
    } else if (signal.action === 'sell') {
      this.executeSell(currentCandle, signal);
    }

    // Verificar stop loss / take profit nas posições abertas
    this.checkStopLossAndTakeProfit(currentCandle);
  }

  private executeBuy(candle: CandleData, signal: TradingSignal): void {
    const price = this.applySlippage(signal.price, 'buy');
    const commission = price * signal.quantity * this.config.commissionRate;
    const totalCost = (price * signal.quantity) + commission;

    if (totalCost > this.balance) {
      console.log('⚠️ Insufficient balance for buy order');
      return;
    }

    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random()}`,
      type: 'buy',
      openPrice: price,
      openTime: candle.time,
      quantity: signal.quantity,
      status: 'open'
    };

    this.balance -= totalCost;
    this.openTrades.push(trade);
    this.trades.push(trade);

    console.log('💰 Buy executed:', {
      price,
      quantity: signal.quantity,
      cost: totalCost,
      remainingBalance: this.balance
    });
  }

  private executeSell(candle: CandleData, signal: TradingSignal): void {
    // Para sell, precisamos fechar posições buy existentes
    const buyTradesToClose = this.openTrades
      .filter(t => t.type === 'buy')
      .slice(0, Math.ceil(signal.quantity));

    for (const trade of buyTradesToClose) {
      this.closeTrade(trade, candle, signal.price);
    }
  }

  private closeTrade(trade: Trade, candle: CandleData, closePrice: number): void {
    const price = this.applySlippage(closePrice, 'sell');
    const commission = price * trade.quantity * this.config.commissionRate;
    
    trade.closePrice = price;
    trade.closeTime = candle.time;
    trade.status = 'closed';

    // Calcular P&L
    if (trade.type === 'buy') {
      trade.pnl = ((price - trade.openPrice) * trade.quantity) - commission;
    } else {
      trade.pnl = ((trade.openPrice - price) * trade.quantity) - commission;
    }

    this.balance += (price * trade.quantity) - commission;
    this.openTrades = this.openTrades.filter(t => t.id !== trade.id);

    if (this.strategy.onTrade) {
      this.strategy.onTrade(trade);
    }

    console.log('📊 Trade closed:', {
      id: trade.id,
      pnl: trade.pnl,
      newBalance: this.balance
    });
  }

  private applySlippage(price: number, side: 'buy' | 'sell'): number {
    const slippage = price * this.config.slippageRate;
    return side === 'buy' ? price + slippage : price - slippage;
  }

  private updateEquity(candle: CandleData): void {
    let unrealizedPnL = 0;

    for (const trade of this.openTrades) {
      if (trade.type === 'buy') {
        unrealizedPnL += (candle.close - trade.openPrice) * trade.quantity;
      } else {
        unrealizedPnL += (trade.openPrice - candle.close) * trade.quantity;
      }
    }

    const currentEquity = this.balance + unrealizedPnL;
    this.equity.push(currentEquity);
    this.maxEquity = Math.max(this.maxEquity, currentEquity);
  }

  private checkStopLossAndTakeProfit(candle: CandleData): void {
    // Implementar lógica de stop loss/take profit conforme necessário
    // Por simplicidade, não implementando agora
  }

  private closeAllOpenTrades(lastCandle: CandleData): void {
    for (const trade of [...this.openTrades]) {
      this.closeTrade(trade, lastCandle, lastCandle.close);
    }
  }

  private calculateResults(): BacktestResult {
    const closedTrades = this.trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl! > 0);
    const losingTrades = closedTrades.filter(t => t.pnl! <= 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    // Calcular drawdown máximo
    let maxDrawdown = 0;
    for (let i = 0; i < this.equity.length; i++) {
      const peak = Math.max(...this.equity.slice(0, i + 1));
      const drawdown = ((peak - this.equity[i]) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calcular Sharpe Ratio (simplificado)
    const returns = this.equity.slice(1).map((equity, i) => 
      (equity - this.equity[i]) / this.equity[i]
    );
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0;

    const result: BacktestResult = {
      trades: this.trades,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnL,
      maxDrawdown,
      sharpeRatio,
      startBalance: this.config.initialBalance,
      endBalance: this.balance,
      equity: this.equity
    };

    console.log('📈 Backtest completed:', result);
    return result;
  }
}

// Estratégia de exemplo: SMA Crossover
export class SMAStrategy extends TradingStrategy {
  constructor(private shortPeriod: number = 10, private longPeriod: number = 20) {
    super();
  }

  getName(): string {
    return `SMA Crossover (${this.shortPeriod}/${this.longPeriod})`;
  }

  generateSignal(candles: CandleData[], currentIndex: number): TradingSignal {
    if (currentIndex < this.longPeriod) {
      return { action: 'hold', price: 0, quantity: 0, confidence: 0, reason: 'Insufficient data' };
    }

    const recentCandles = candles.slice(currentIndex - this.longPeriod + 1, currentIndex + 1);
    const shortSMA = this.calculateSMA(recentCandles.slice(-this.shortPeriod));
    const longSMA = this.calculateSMA(recentCandles);
    
    const prevCandles = candles.slice(currentIndex - this.longPeriod, currentIndex);
    const prevShortSMA = this.calculateSMA(prevCandles.slice(-this.shortPeriod));
    const prevLongSMA = this.calculateSMA(prevCandles);

    const currentCandle = candles[currentIndex];

    // Golden Cross (SMA curta cruza acima da longa)
    if (prevShortSMA <= prevLongSMA && shortSMA > longSMA) {
      return {
        action: 'buy',
        price: currentCandle.close,
        quantity: 1,
        confidence: 0.7,
        reason: 'Golden Cross'
      };
    }

    // Death Cross (SMA curta cruza abaixo da longa)
    if (prevShortSMA >= prevLongSMA && shortSMA < longSMA) {
      return {
        action: 'sell',
        price: currentCandle.close,
        quantity: 1,
        confidence: 0.7,
        reason: 'Death Cross'
      };
    }

    return { action: 'hold', price: 0, quantity: 0, confidence: 0, reason: 'No signal' };
  }

  private calculateSMA(candles: CandleData[]): number {
    const sum = candles.reduce((total, candle) => total + candle.close, 0);
    return sum / candles.length;
  }
}
