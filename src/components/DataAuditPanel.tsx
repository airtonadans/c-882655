
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealMarketData } from '../hooks/useRealMarketData';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

const DataAuditPanel: React.FC = () => {
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const { getMarketData } = useRealMarketData();

  const runAudit = async () => {
    setIsAuditing(true);
    
    try {
      console.log('🔍 [AUDIT START] Iniciando auditoria completa dos dados...');
      
      // Test with reference date: 02/01/2024
      const referenceDate = '2024-01-02';
      
      const data = await getMarketData({
        symbol: 'XAUUSD',
        timeframe: '5min',
        startDate: referenceDate,
        endDate: referenceDate,
        limit: 300
      });

      console.log('📊 [AUDIT] Raw data received:', data);

      if (!data || data.length === 0) {
        setAuditResult({
          status: 'ERROR',
          message: 'Nenhum dado encontrado para a data de referência',
          details: {
            dataSource: 'FAILED',
            granularity: 'UNKNOWN',
            volume: 'UNKNOWN',
            rendering: 'UNKNOWN'
          }
        });
        return;
      }

      // Detailed analysis
      const analysis = {
        totalRecords: data.length,
        dateRange: {
          start: new Date(data[0]?.time * 1000).toISOString(),
          end: new Date(data[data.length - 1]?.time * 1000).toISOString()
        },
        volume: {
          recordsWithVolume: data.filter(d => d.volume && d.volume > 0).length,
          averageVolume: data.reduce((sum, d) => sum + (d.volume || 0), 0) / data.length,
          maxVolume: Math.max(...data.map(d => d.volume || 0)),
          minVolume: Math.min(...data.map(d => d.volume || 0))
        },
        priceAnalysis: {
          openPrice: data[0]?.open,
          closePrice: data[data.length - 1]?.close,
          maxPrice: Math.max(...data.map(d => d.high)),
          minPrice: Math.min(...data.map(d => d.low)),
          totalVariation: Math.abs(data[data.length - 1]?.close - data[0]?.open),
          variationPercent: ((data[data.length - 1]?.close - data[0]?.open) / data[0]?.open * 100).toFixed(4)
        },
        granularity: {
          intervals: [],
          avgInterval: 0
        },
        dataQuality: {
          duplicates: 0,
          gaps: 0,
          invalidRecords: 0
        }
      };

      // Check intervals
      for (let i = 1; i < Math.min(data.length, 50); i++) {
        const interval = data[i].time - data[i - 1].time;
        analysis.granularity.intervals.push(interval);
      }
      analysis.granularity.avgInterval = analysis.granularity.intervals.reduce((a, b) => a + b, 0) / analysis.granularity.intervals.length;

      // Check for data quality issues
      const timeSet = new Set();
      data.forEach((record, index) => {
        if (timeSet.has(record.time)) {
          analysis.dataQuality.duplicates++;
        }
        timeSet.add(record.time);

        if (!record.open || !record.high || !record.low || !record.close) {
          analysis.dataQuality.invalidRecords++;
        }
      });

      console.log('📈 [AUDIT ANALYSIS]:', analysis);

      // Determine status
      const checks = {
        dataSource: data.length > 0 ? 'OK' : 'ERROR',
        granularity: analysis.granularity.avgInterval === 300 ? 'OK' : analysis.granularity.avgInterval > 0 ? 'WARNING' : 'ERROR', // 300s = 5min
        volume: analysis.volume.recordsWithVolume > data.length * 0.8 ? 'OK' : analysis.volume.recordsWithVolume > 0 ? 'WARNING' : 'ERROR',
        rendering: analysis.dataQuality.invalidRecords === 0 ? 'OK' : 'ERROR'
      };

      setAuditResult({
        status: Object.values(checks).includes('ERROR') ? 'ERROR' : Object.values(checks).includes('WARNING') ? 'WARNING' : 'OK',
        referenceDate,
        analysis,
        checks,
        sampleData: data.slice(0, 5)
      });

    } catch (error) {
      console.error('🚨 [AUDIT ERROR]:', error);
      setAuditResult({
        status: 'ERROR',
        message: `Erro durante auditoria: ${error.message}`,
        details: {
          dataSource: 'ERROR',
          granularity: 'ERROR',
          volume: 'ERROR',
          rendering: 'ERROR'
        }
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
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
    <Card className="p-6 bg-gray-900 border-gray-700 text-white">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Auditoria de Dados</h3>
          <Button 
            onClick={runAudit} 
            disabled={isAuditing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAuditing ? 'Auditando...' : 'Executar Auditoria'}
          </Button>
        </div>

        {auditResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(auditResult.status)} text-white`}>
                Status Geral: {auditResult.status}
              </Badge>
              {auditResult.referenceDate && (
                <span className="text-sm text-gray-400">
                  Data de referência: {auditResult.referenceDate}
                </span>
              )}
            </div>

            {auditResult.checks && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-300">Checklist Técnico</h4>
                  
                  {Object.entries(auditResult.checks).map(([key, status]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm">{key}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status as string)}
                        <Badge className={`${getStatusColor(status as string)} text-white text-xs`}>
                          {status as string}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {auditResult.analysis && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-300">Análise Detalhada</h4>
                    <div className="p-3 bg-gray-800 rounded text-xs space-y-1">
                      <div>Registros: {auditResult.analysis.totalRecords}</div>
                      <div>Intervalo médio: {auditResult.analysis.granularity?.avgInterval}s</div>
                      <div>Volume médio: {auditResult.analysis.volume?.averageVolume?.toFixed(2)}</div>
                      <div>Variação total: ${auditResult.analysis.priceAnalysis?.totalVariation?.toFixed(2)}</div>
                      <div>Variação %: {auditResult.analysis.priceAnalysis?.variationPercent}%</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {auditResult.sampleData && auditResult.sampleData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300">Amostra de Dados (Primeiros 5)</h4>
                <div className="bg-gray-800 rounded p-3 text-xs font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(auditResult.sampleData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DataAuditPanel;
