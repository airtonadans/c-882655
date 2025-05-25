
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TimeframeSelectorProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const timeframes = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
];

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onTimeframeChange,
}) => {
  return (
    <ToggleGroup 
      type="single" 
      value={selectedTimeframe} 
      onValueChange={onTimeframeChange}
      className="grid grid-cols-5 gap-1"
    >
      {timeframes.map((tf) => (
        <ToggleGroupItem 
          key={tf.value} 
          value={tf.value}
          className="h-9 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {tf.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default TimeframeSelector;
