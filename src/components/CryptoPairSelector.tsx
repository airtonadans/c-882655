
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CryptoPairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

const cryptoPairs = [
  { value: 'BTCUSDT', label: 'BTC/USDT', icon: '₿' },
  { value: 'ETHUSDT', label: 'ETH/USDT', icon: 'Ξ' },
  { value: 'BNBUSDT', label: 'BNB/USDT', icon: 'B' },
  { value: 'ADAUSDT', label: 'ADA/USDT', icon: 'A' },
  { value: 'XRPUSDT', label: 'XRP/USDT', icon: 'X' },
  { value: 'SOLUSDT', label: 'SOL/USDT', icon: 'S' },
  { value: 'DOTUSDT', label: 'DOT/USDT', icon: 'D' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT', icon: 'Ð' },
];

const CryptoPairSelector: React.FC<CryptoPairSelectorProps> = ({
  selectedPair,
  onPairChange,
}) => {
  return (
    <Select value={selectedPair} onValueChange={onPairChange}>
      <SelectTrigger className="w-[140px] bg-card border-border">
        <SelectValue placeholder="Selecionar Par" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {cryptoPairs.map((pair) => (
          <SelectItem 
            key={pair.value} 
            value={pair.value}
            className="focus:bg-secondary focus:text-secondary-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{pair.icon}</span>
              <span>{pair.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CryptoPairSelector;
