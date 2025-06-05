
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, BarChart3, TrendingUp, Database } from 'lucide-react';
import { useRealMarketData } from '../hooks/useRealMarketData';
import { toast } from 'sonner';

const DataAuditPanel = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('2024-01-02');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5min');
  
  const { getMarketData } = useRealMarketData();

  const runDataAudit = async () => {
    setIsAuditing(true);
    try {
      console.log('🔍 [AUDIT] Starting comprehensive data audit...');
      
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe: selectedTimeframe,
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 500
      });

      if (!data || data.length === 0) {
        setAuditResult({
          status: 'ERROR',
          message: 'Nenhum dado encontrado para auditoria',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Perform comprehensive audit
      const audit = performDataAudit(data, selectedTimeframe);
      setAuditResult(audit);
      
      console.log('📊 [AUDIT] Complete audit result:', audit);
      
    } catch (error: any) {
      console.error('🚨 [AUDIT] Error during audit:', error);
      setAuditResult({
        status: 'ERROR',
        message: `Erro na auditoria: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      toast.error(`Erro na auditoria: ${error.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const performDataAudit = (data: any[], timeframe: string) => {
    const audit = {
      status: 'OK' as 'OK' | 'WARNING' | 'ERROR',
      timestamp: new Date().toISOString(),
      referenceDate: selectedDate,
      timeframe,
      totalRecords: data.length,
      checks: {} as any,
      sampleData: data.slice(0, 5),
      issues: [] as string[]
    };

    // Check 1: Data structure validation
    const structureCheck = validateDataStructure(data);
    audit.checks.structure = structureCheck;
    if (structureCheck.status !== 'OK') {
      audit.status = structureCheck.status;
      audit.issues.push(...structureCheck.issues);
    }

    // Check 2: Timestamp uniqueness and granularity
    const granularityCheck = validateGranularity(data, timeframe);
    audit.checks.granularity = granularityCheck;
    if (granularityCheck.status !== 'OK') {
      if (audit.status === 'OK') audit.status = granularityCheck.status;
      audit.issues.push(...granularityCheck.issues);
    }

    // Check 3: Volume validation
    const volumeCheck = validateVolume(data);
    audit.checks.volume = volumeCheck;
    if (volumeCheck.status !== 'OK') {
      if (audit.status === 'OK') audit.status = volumeCheck.status;
      audit.issues.push(...volumeCheck.issues);
    }

    // Check 4: Price validation
    const priceCheck = validatePrices(data);
    audit.checks.prices = priceCheck;
    if (priceCheck.status !== 'OK') {
      if (audit.status === 'OK') audit.status = priceCheck.status;
      audit.issues.push(...priceCheck.issues);
    }

    // Check 5: Market realism
    const realismCheck = validateMarketRealism(data);
    audit.checks.realism = realismCheck;
    if (realismCheck.status !== 'OK') {
      if (audit.status === 'OK') audit.status = realismCheck.status;
      audit.issues.push(...realismCheck.issues);
    }

    return audit;
  };

  const validateDataStructure = (data: any[]) => {
    const check = { status: 'OK' as any, issues: [] as string[], details: {} };
    
    const requiredFields = ['time', 'open', 'high', 'low', 'close', 'volume'];
    const sampleRecord = data[0];
    
    const missingFields = requiredFields.filter(field => !(field in sampleRecord));
    if (missingFields.length > 0) {
      check.status = 'ERROR';
      check.issues.push(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }

    // Validate data types
    data.slice(0, 10).forEach((record, index) => {
      if (typeof record.open !== 'number' || typeof record.close !== 'number') {
        check.status = 'WARNING';
        check.issues.push(`Registro ${index}: preços não são números`);
      }
    });

    check.details = {
      totalRecords: data.length,
      fieldsPresent: Object.keys(sampleRecord),
      sampleTypes: {
        time: typeof sampleRecord.time,
        open: typeof sampleRecord.open,
        close: typeof sampleRecord.close,
        volume: typeof sampleRecord.volume
      }
    };

    return check;
  };

  const validateGranularity = (data: any[], expectedTimeframe: string) => {
    const check = { status: 'OK' as any, issues: [] as string[], details: {} };
    
    if (data.length < 2) {
      check.status = 'WARNING';
      check.issues.push('Dados insuficientes para validar granularidade');
      return check;
    }

    // Get expected interval in seconds
    const expectedIntervalSeconds = getExpectedInterval(expectedTimeframe);
    
    // Check timestamp uniqueness
    const timestamps = data.map(d => d.time);
    const uniqueTimestamps = new Set(timestamps);
    const duplicates = timestamps.length - uniqueTimestamps.size;
    
    if (duplicates > 0) {
      check.status = 'ERROR';
      check.issues.push(`${duplicates} timestamps duplicados encontrados`);
    }

    // Calculate actual intervals
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(data.length, 50); i++) {
      const interval = data[i].time - data[i-1].time;
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const minInterval = Math.min(...intervals);
    const maxInterval = Math.max(...intervals);

    // Check if intervals are consistent with expected timeframe
    const tolerance = expectedIntervalSeconds * 0.1; // 10% tolerance
    const intervalDeviations = intervals.filter(interval => 
      Math.abs(interval - expectedIntervalSeconds) > tolerance
    );

    if (intervalDeviations.length > intervals.length * 0.1) { // More than 10% deviations
      check.status = 'WARNING';
      check.issues.push(`Intervalos inconsistentes: esperado ${expectedIntervalSeconds}s, encontrado média ${avgInterval.toFixed(1)}s`);
    }

    check.details = {
      expectedIntervalSeconds,
      avgIntervalSeconds: avgInterval,
      minIntervalSeconds: minInterval,
      maxIntervalSeconds: maxInterval,
      duplicateTimestamps: duplicates,
      uniqueTimestamps: uniqueTimestamps.size,
      totalTimestamps: timestamps.length,
      intervalDeviations: intervalDeviations.length,
      consistencyPercentage: ((intervals.length - intervalDeviations.length) / intervals.length * 100).toFixed(1)
    };

    return check;
  };

  const validateVolume = (data: any[]) => {
    const check = { status: 'OK' as any, issues: [] as string[], details: {} };
    
    const volumes = data.map(d => d.volume || 0);
    const nonZeroVolumes = volumes.filter(v => v > 0);
    const zeroVolumePercentage = ((volumes.length - nonZeroVolumes.length) / volumes.length) * 100;

    if (zeroVolumePercentage > 50) {
      check.status = 'WARNING';
      check.issues.push(`${zeroVolumePercentage.toFixed(1)}% dos candles têm volume zero`);
    }

    const avgVolume = nonZeroVolumes.length > 0 ? 
      nonZeroVolumes.reduce((sum, v) => sum + v, 0) / nonZeroVolumes.length : 0;

    check.details = {
      totalCandles: volumes.length,
      candlesWithVolume: nonZeroVolumes.length,
      zeroVolumePercentage: zeroVolumePercentage.toFixed(1),
      averageVolume: avgVolume.toFixed(2),
      maxVolume: Math.max(...volumes),
      minVolume: Math.min(...volumes.filter(v => v > 0))
    };

    return check;
  };

  const validatePrices = (data: any[]) => {
    const check = { status: 'OK' as any, issues: [] as string[], details: {} };
    
    let invalidCandles = 0;
    data.forEach((candle, index) => {
      if (candle.high < candle.low || 
          candle.open < candle.low || candle.open > candle.high ||
          candle.close < candle.low || candle.close > candle.high) {
        invalidCandles++;
        if (invalidCandles <= 3) { // Show only first 3 errors
          check.issues.push(`Candle ${index}: OHLC inválido (H:${candle.high} L:${candle.low} O:${candle.open} C:${candle.close})`);
        }
      }
    });

    if (invalidCandles > 0) {
      check.status = 'ERROR';
      if (invalidCandles > 3) {
        check.issues.push(`... e mais ${invalidCandles - 3} candles com OHLC inválido`);
      }
    }

    // Price range analysis
    const allPrices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceVariation = (priceRange / minPrice) * 100;

    check.details = {
      invalidCandles,
      validationRate: ((data.length - invalidCandles) / data.length * 100).toFixed(1),
      priceRange: {
        min: minPrice.toFixed(2),
        max: maxPrice.toFixed(2),
        variation: priceVariation.toFixed(2) + '%'
      }
    };

    return check;
  };

  const validateMarketRealism = (data: any[]) => {
    const check = { status: 'OK' as any, issues: [] as string[], details: {} };
    
    if (data.length < 10) {
      check.status = 'WARNING';
      check.issues.push('Dados insuficientes para análise de realismo');
      return check;
    }

    // Check for unrealistic consecutive movements
    let consecutiveBullish = 0;
    let consecutiveBearish = 0;
    let maxConsecutiveBullish = 0;
    let maxConsecutiveBearish = 0;

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      if (candle.close > candle.open) {
        consecutiveBullish++;
        consecutiveBearish = 0;
        maxConsecutiveBullish = Math.max(maxConsecutiveBullish, consecutiveBullish);
      } else if (candle.close < candle.open) {
        consecutiveBearish++;
        consecutiveBullish = 0;
        maxConsecutiveBearish = Math.max(maxConsecutiveBearish, consecutiveBearish);
      } else {
        consecutiveBullish = 0;
        consecutiveBearish = 0;
      }
    }

    // Check for unrealistic consecutive movements (more than 20 in a row is suspicious)
    if (maxConsecutiveBullish > 20) {
      check.status = 'WARNING';
      check.issues.push(`${maxConsecutiveBullish} candles consecutivos de alta (suspeito)`);
    }

    if (maxConsecutiveBearish > 20) {
      check.status = 'WARNING';
      check.issues.push(`${maxConsecutiveBearish} candles consecutivos de baixa (suspeito)`);
    }

    // Volatility check
    const priceChanges = [];
    for (let i = 1; i < data.length; i++) {
      const change = Math.abs(data[i].close - data[i-1].close) / data[i-1].close;
      priceChanges.push(change);
    }

    const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const maxChange = Math.max(...priceChanges);

    // For XAUUSD, changes > 5% in a single candle are unusual
    const extremeChanges = priceChanges.filter(change => change > 0.05);
    if (extremeChanges.length > priceChanges.length * 0.01) { // More than 1%
      check.status = 'WARNING';
      check.issues.push(`${extremeChanges.length} mudanças extremas de preço (>5%)`);
    }

    check.details = {
      maxConsecutiveBullish,
      maxConsecutiveBearish,
      averageVolatility: (avgVolatility * 100).toFixed(4) + '%',
      maxPriceChange: (maxChange * 100).toFixed(2) + '%',
      extremeChanges: extremeChanges.length,
      totalPriceChanges: priceChanges.length
    };

    return check;
  };

  const getExpectedInterval = (timeframe: string): number => {
    switch (timeframe) {
      case '1s': return 1;
      case '5s': return 5;
      case '10s': return 10;
      case '30s': return 30;
      case '1min': return 60;
      case '2min': return 120;
      case '5min': return 300;
      case '10min': return 600;
      case '15min': return 900;
      case '30min': return 1800;
      case '1h': return 3600;
      default: return 300;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-600';
      case 'WARNING': return 'bg-yellow-600';
      case 'ERROR': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Controls */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-white">Auditoria Técnica de Dados</h2>
          <Badge className="bg-red-600 text-white text-xs">CRITICAL</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Data de Referência</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="1s">1 segundo</SelectItem>
                <SelectItem value="5s">5 segundos</SelectItem>
                <SelectItem value="30s">30 segundos</SelectItem>
                <SelectItem value="1min">1 minuto</SelectItem>
                <SelectItem value="5min">5 minutos</SelectItem>
                <SelectItem value="15min">15 minutos</SelectItem>
                <SelectItem value="1h">1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={runDataAudit}
              disabled={isAuditing}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isAuditing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Auditando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Iniciar Auditoria
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Results */}
      {auditResult && (
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(auditResult.status)}
              <h3 className="text-lg font-semibold text-white">Resultado da Auditoria</h3>
              <Badge className={`${getStatusColor(auditResult.status)} text-white text-xs`}>
                {auditResult.status}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(auditResult.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {auditResult.checks && Object.entries(auditResult.checks).map(([checkName, check]: [string, any]) => (
              <div key={checkName} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(check.status)}
                  <span className="text-sm font-medium text-white capitalize">{checkName}</span>
                </div>
                <Badge className={`${getStatusColor(check.status)} text-white text-xs`}>
                  {check.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Issues */}
          {auditResult.issues && auditResult.issues.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-red-400 mb-3">Issues Encontrados:</h4>
              <div className="space-y-2">
                {auditResult.issues.map((issue: string, index: number) => (
                  <div key={index} className="p-2 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Results */}
          {auditResult.checks && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-300">Detalhes da Auditoria:</h4>
              
              {/* Granularity Details */}
              {auditResult.checks.granularity && (
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-2">Granularidade</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Esperado:</span>
                      <span className="text-white ml-2">{auditResult.checks.granularity.details.expectedIntervalSeconds}s</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Média:</span>
                      <span className="text-white ml-2">{auditResult.checks.granularity.details.avgIntervalSeconds}s</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Consistência:</span>
                      <span className="text-white ml-2">{auditResult.checks.granularity.details.consistencyPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duplicatas:</span>
                      <span className="text-white ml-2">{auditResult.checks.granularity.details.duplicateTimestamps}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Data */}
              {auditResult.sampleData && auditResult.sampleData.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-2">Amostra de Dados (5 primeiros registros)</h5>
                  <div className="overflow-x-auto">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(auditResult.sampleData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DataAuditPanel;
