
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

  // Debug logs
  useEffect(() => {
    console.log('ProfessionalCandleChart - Data received:', {
      dataLength: data.length,
      currentIndex,
      firstItem: data[0],
      lastItem: data[data.length - 1]
    });
  }, [data, currentIndex]);

  useEffect(() => {
    if (data.length > 0) {
      let dataToShow: CandleData[];
      
      if (currentIndex >= 0) {
        // Replay mode - show data up to current index
        dataToShow = data.slice(0, currentIndex + 1);
      } else {
        // History mode - show all data
        dataToShow = data;
      }
      
      console.log('Setting visible data:', {
        totalData: data.length,
        currentIndex,
        visibleLength: dataToShow.length
      });
      
      setVisibleData(dataToShow);
    } else {
      setVisibleData([]);
    }
  }, [data, currentIndex]);

  useEffect(() => {
    if (visibleData.length > 0) {
      console.log('Processing visible data for chart:', {
        length: visibleData.length,
        sample: visibleData.slice(0, 3).map(d => ({
          time: d.time,
          timestamp: new Date(d.time * 1000).toISOString(),
          ohlc: [d.open, d.high, d.low, d.close]
        }))
      });

      // Validate and clean data
      const validData = visibleData.filter(d => 
        d && 
        typeof d.time === 'number' && 
        typeof d.open === 'number' && 
        typeof d.high === 'number' && 
        typeof d.low === 'number' && 
        typeof d.close === 'number' &&
        !isNaN(d.time) &&
        !isNaN(d.open) &&
        !isNaN(d.high) &&
        !isNaN(d.low) &&
        !isNaN(d.close)
      );

      console.log(`Filtered ${validData.length} valid data points from ${visibleData.length}`);

      if (validData.length === 0) {
        console.warn('No valid data points found');
        setPlotlyData([]);
        return;
      }

      // Sort by time to ensure proper order
      validData.sort((a, b) => a.time - b.time);

      // Create datetime array from timestamps
      const dates = validData.map(d => {
        const date = new Date(d.time * 1000);
        console.log(`Converting timestamp ${d.time} to date:`, date.toISOString());
        return date;
      });

      const trace = {
        x: dates,
        open: validData.map(d => d.open),
        high: validData.map(d => d.high),
        low: validData.map(d => d.low),
        close: validData.map(d => d.close),
        
        increasing: { 
          line: { color: '#0ECB81', width: 1 }, 
          fillcolor: '#0ECB81' 
        }, 
        decreasing: { 
          line: { color: '#F6465D', width: 1 }, 
          fillcolor: '#F6465D' 
        },
        line: { width: 1 },
        
        type: 'candlestick',
        xaxis: 'x',
        yaxis: 'y',
        name: 'XAUUSD',
        hovertemplate: 
          'Data: %{x}<br>' +
          'Abertura: $%{open:.2f}<br>' +
          'Máxima: $%{high:.2f}<br>' +
          'Mínima: $%{low:.2f}<br>' +
          'Fechamento: $%{close:.2f}<br>' +
          '<extra></extra>'
      };

      setPlotlyData([trace]);

      // Calculate price range for better Y-axis scaling
      const allPrices = validData.flatMap(d => [d.open, d.high, d.low, d.close]);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.05; // 5% padding

      const layout: Partial<Plotly.Layout> = {
        dragmode: 'pan',
        margin: { l: 40, r: 60, t: 10, b: 40 },
        showlegend: false,
        xaxis: {
          type: 'date',
          gridcolor: '#374151',
          linecolor: '#374151',
          tickfont: { color: '#9CA3AF', size: 10 },
          fixedrange: false,
          rangeslider: { visible: false },
          tickformat: '%H:%M<br>%d/%m',
          nticks: Math.min(10, Math.floor(validData.length / 10) + 1),
        },
        yaxis: {
          type: 'linear',
          gridcolor: '#374151',
          linecolor: '#374151',
          tickfont: { color: '#9CA3AF', size: 10 },
          side: 'right',
          fixedrange: false,
          tickprefix: '$',
          range: [minPrice - padding, maxPrice + padding],
          tickformat: '.2f'
        },
        plot_bgcolor: '#111827',
        paper_bgcolor: '#1F2937',
        font: { color: '#9CA3AF' },
      };
      
      setPlotlyLayout(layout);

      console.log('Chart updated with data:', {
        dataPoints: validData.length,
        dateRange: {
          start: dates[0]?.toISOString(),
          end: dates[dates.length - 1]?.toISOString()
        },
        priceRange: { min: minPrice, max: maxPrice }
      });

    } else {
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500 rounded-md">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              XAUUSD
            </h3>
            <p className="text-xs text-gray-400">
              Ouro / Dólar Americano
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
          <div className="mt-2 text-xs text-center text-gray-400">
            {currentCandle.time ? new Date(currentCandle.time * 1000).toLocaleString('pt-BR') : 'N/A'}
          </div>
        </div>
      )}

      <div className="h-[400px] w-full">
        {visibleData.length > 0 ? (
          <Plot
            data={plotlyData}
            layout={plotlyLayout}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            config={{
              displaylogo: false,
              displayModeBar: true,
              modeBarButtonsToRemove: ['lasso2d', 'select2d'],
              scrollZoom: true,
              doubleClick: 'reset+autosize'
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Aguardando dados...
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Carregue dados ou inicie replay
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfessionalCandleChart;
