
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CandleData } from '../utils/advancedMarketGenerator';

interface EChartsCandleProps {
  data: CandleData[];
  currentIndex?: number;
  currentCandle?: CandleData | null;
  isActive?: boolean;
  height?: string;
}

const EChartsCandle: React.FC<EChartsCandleProps> = ({ 
  data, 
  currentIndex = -1, 
  currentCandle,
  isActive = false,
  height = '400px'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const chart = chartInstance.current;

    if (data.length === 0) {
      chart.clear();
      return;
    }

    console.log('ECharts - Processing data:', {
      totalData: data.length,
      currentIndex,
      sample: data.slice(0, 3).map(d => ({
        time: d.time,
        date: new Date(d.time * 1000).toISOString(),
        ohlc: [d.open, d.high, d.low, d.close]
      }))
    });

    // Prepare data for ECharts
    let visibleData = data;
    if (currentIndex >= 0) {
      // Replay mode - show data up to current index
      visibleData = data.slice(0, currentIndex + 1);
    }

    // Sort data by time to ensure correct order
    visibleData.sort((a, b) => a.time - b.time);

    // Convert data to ECharts format
    const chartData = visibleData.map(candle => {
      const date = new Date(candle.time * 1000);
      return [
        date.toISOString().split('T')[0], // Date string
        candle.open,
        candle.close,
        candle.low,
        candle.high,
        candle.volume || 0
      ];
    });

    console.log('ECharts - Chart data prepared:', {
      visibleLength: visibleData.length,
      chartDataLength: chartData.length,
      sampleChartData: chartData.slice(0, 3)
    });

    // Calculate value range for better scaling
    const allValues = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.02; // 2% padding

    const option: echarts.EChartsOption = {
      backgroundColor: '#111827',
      animation: false,
      grid: {
        left: '8%',
        right: '8%',
        top: '10%',
        bottom: '15%'
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item[0]),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          formatter: function (value: string) {
            const date = new Date(value);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          },
          color: '#9CA3AF'
        }
      },
      yAxis: {
        scale: true,
        min: minValue - padding,
        max: maxValue + padding,
        axisLabel: {
          formatter: function (value: number) {
            return `$${value.toFixed(2)}`;
          },
          color: '#9CA3AF'
        },
        splitLine: {
          lineStyle: {
            color: '#374151'
          }
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        textStyle: {
          color: '#F9FAFB'
        },
        formatter: function (params: any) {
          const data = params[0];
          if (!data || !data.data) return '';
          
          const [date, open, close, low, high, volume] = data.data;
          const color = close >= open ? '#22C55E' : '#EF4444';
          const trend = close >= open ? '↑' : '↓';
          
          return `
            <div style="font-size: 12px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${new Date(date).toLocaleDateString('pt-BR')}</div>
              <div style="color: ${color}; margin-bottom: 4px;">${trend} ${close >= open ? 'Alta' : 'Baixa'}</div>
              <div>Abertura: <span style="font-family: monospace;">$${open.toFixed(2)}</span></div>
              <div>Máxima: <span style="font-family: monospace; color: #22C55E;">$${high.toFixed(2)}</span></div>
              <div>Mínima: <span style="font-family: monospace; color: #EF4444;">$${low.toFixed(2)}</span></div>
              <div>Fechamento: <span style="font-family: monospace; color: ${color};">$${close.toFixed(2)}</span></div>
              <div>Volume: <span style="font-family: monospace;">${(volume / 1000000).toFixed(2)}M</span></div>
            </div>
          `;
        }
      },
      series: [
        {
          name: 'XAUUSD',
          type: 'candlestick',
          data: chartData.map(item => [item[1], item[2], item[3], item[4]]), // [open, close, low, high]
          itemStyle: {
            color: '#22C55E', // Green for bullish
            color0: '#EF4444', // Red for bearish
            borderColor: '#22C55E',
            borderColor0: '#EF4444'
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2
            }
          }
        }
      ]
    };

    chart.setOption(option, true);

    // Handle window resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height,
        minHeight: '300px'
      }} 
    />
  );
};

export default EChartsCandle;
