import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { CandleData } from '../utils/advancedMarketGenerator';

interface ProfessionalCandleChartProps {
  data: CandleData[];
  currentIndex: number;
  currentCandle: CandleData | null;
  isActive: boolean;
  // TODO: Add timeframe prop later
}

const ProfessionalCandleChart: React.FC<ProfessionalCandleChartProps> = ({ 
  data, 
  currentIndex, 
  currentCandle,
  isActive 
}) => {
  const [visibleData, setVisibleData] = useState<CandleData[]>([]);
  const [plotlyData, setPlotlyData] = useState<any[]>([]);
  const [plotlyLayout, setPlotlyLayout] = useState<Partial<Plotly.Layout>>({});

  useEffect(() => {
    if (data.length > 0 && currentIndex >= 0) {
      // TODO: Add logic here later to aggregate data based on selected timeframe
      const dataToShow = data.slice(0, currentIndex + 1);
      setVisibleData(dataToShow);
    } else {
      setVisibleData([]);
    }
  }, [data, currentIndex]); // TODO: Add timeframe dependency later

  useEffect(() => {
    if (visibleData.length > 0) {
      // Prepara os dados para o formato do Plotly Candlestick
      const trace = {
        x: visibleData.map(d => new Date(d.time * 1000)), // Converte timestamp para Date object
        open: visibleData.map(d => d.open),
        high: visibleData.map(d => d.high),
        low: visibleData.map(d => d.low),
        close: visibleData.map(d => d.close),
        
        // Estilo do candlestick
        increasing: { line: { color: '#0ECB81', width: 1 }, fillcolor: '#0ECB81' }, 
        decreasing: { line: { color: '#F6465D', width: 1 }, fillcolor: '#F6465D' },
        line: { width: 1 }, // Largura do pavio (wick)
        
        type: 'candlestick',
        xaxis: 'x',
        yaxis: 'y',
        name: 'Candles' // Nome para legenda (embora desativada)
      };

      setPlotlyData([trace]);

      // Configura o layout do gráfico
      const layout: Partial<Plotly.Layout> = {
        dragmode: 'pan', // Permite arrastar/pan
        margin: { l: 40, r: 60, t: 10, b: 40 }, // Ajusta margens
        showlegend: false,
        xaxis: {
          autorange: true,
          type: 'date',
          gridcolor: '#374151',
          linecolor: '#374151',
          tickfont: { color: '#9CA3AF', size: 10 },
          fixedrange: false, // Permite zoom no eixo X
          rangeslider: { visible: false }, // Esconde o range slider inferior
          // Formata os ticks do eixo X para mostrar Hora:Minuto
          tickformat: '%H:%M', 
          // Melhora a exibição dos ticks de data/hora
          nticks: 6, // Sugere um número de ticks (Plotly pode ajustar)
        },
        yaxis: {
          autorange: true,
          type: 'linear',
          gridcolor: '#374151',
          linecolor: '#374151',
          tickfont: { color: '#9CA3AF', size: 10 },
          side: 'right', // Eixo Y na direita
          fixedrange: false, // Permite zoom no eixo Y
          tickprefix: '$', // Adiciona prefixo $ aos ticks
        },
        plot_bgcolor: '#111827', // Cor de fundo do plot (cinza escuro/azulado)
        paper_bgcolor: '#1F2937', // Cor de fundo do card (cinza mais escuro)
        font: { color: '#9CA3AF' }, // Cor da fonte padrão
      };
      setPlotlyLayout(layout);

    } else {
      // Limpa os dados se não houver dados visíveis
      setPlotlyData([]);
      setPlotlyLayout({});
    }
  }, [visibleData]);

  const getCurrentTrend = () => {
    if (!currentCandle) return null;
    const change = currentCandle.close - currentCandle.open;
    if (change > 0) return 'bullish';
    if (change < 0) return 'bearish';
    return 'neutral';
  };

  const trend = getCurrentTrend();

  return (
    <Card className="p-3 bg-gray-900 border-gray-700">
      {/* Header (mantido) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500 rounded-md">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              BTCUSDT
            </h3>
            <p className="text-xs text-gray-400">
              Simulação de Mercado
            </p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1">
            {trend === 'bullish' && (
              <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Alta
              </Badge>
            )}
            {trend === 'bearish' && (
              <Badge className="bg-red-600 text-white text-xs px-2 py-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                Baixa
              </Badge>
            )}
            {trend === 'neutral' && (
              <Badge className="bg-gray-600 text-white text-xs px-2 py-1">
                <Minus className="w-3 h-3 mr-1" />
                Lateral
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Informações do candle atual (mantido) */}
      {currentCandle && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Abertura</p>
              <p className="font-mono font-semibold text-white">
                ${currentCandle.open?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Máxima</p>
              <p className="font-mono font-semibold text-green-400">
                ${currentCandle.high?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Mínima</p>
              <p className="font-mono font-semibold text-red-400">
                ${currentCandle.low?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Fechamento</p>
              <p className={`font-mono font-semibold ${
                currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'
              }`}>
                ${currentCandle.close?.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">Volume</p>
              <p className="font-mono font-semibold text-yellow-400">
                {currentCandle.volume ? (currentCandle.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico com Plotly.js */}
      <div className="h-[400px] w-full">
        {visibleData.length > 0 ? (
          <Plot
            data={plotlyData}
            layout={plotlyLayout}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true} // Habilita o redimensionamento automático
            config={{
              displaylogo: false, // Remove o logo do Plotly
              displayModeBar: false, // Esconde a barra de modo completamente
              scrollZoom: true // Permite zoom com scroll/pinch
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Aguardando simulação...
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Configure as datas e inicie
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalCandleChart;
