
import React from 'react';
import { CandleData } from '../utils/advancedMarketGenerator';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload as CandleData;
  const change = data.close - data.open;
  const changePercent = (change / data.open) * 100;
  const isBullish = change >= 0;
  
  return (
    <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-white">
      <div className="space-y-2">
        <p className="font-medium text-gray-300 text-xs">
          {new Date(data.time * 1000).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Abertura</p>
            <p className="font-mono font-semibold text-white">${data.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Fechamento</p>
            <p className={`font-mono font-semibold ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
              ${data.close.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Máxima</p>
            <p className="font-mono font-semibold text-gray-300">${data.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Mínima</p>
            <p className="font-mono font-semibold text-gray-300">${data.low.toFixed(2)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className={`text-xs font-medium ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}${change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomTooltip;
