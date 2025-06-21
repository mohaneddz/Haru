import { Component, Accessor } from 'solid-js';
import { AngleMode } from '@/types/calculator';

interface InfoPanelsProps {
  displayValue: Accessor<string>;
  angleMode: Accessor<AngleMode>;
  historyLength: number;
  memoryValue: Accessor<number>;
}

const InfoPanels: Component<InfoPanelsProps> = (props) => {
  const currentNum = () => parseFloat(props.displayValue());
  const isValidNumber = () => !isNaN(currentNum());

  return (
    <div class="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Number Base Converter */}
      <div class="bg-sidebar rounded-xl border border-border-light-1 p-4">
        <h4 class="text-sm font-semibold text-accent mb-3">Base Converter</h4>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-text/70">Binary:</span>
            <span class="font-mono">
              {isValidNumber() ? currentNum().toString(2) : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Octal:</span>
            <span class="font-mono">
              {isValidNumber() ? currentNum().toString(8) : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Hexadecimal:</span>
            <span class="font-mono">
              {isValidNumber() ? currentNum().toString(16).toUpperCase() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Unit Converter Quick Access */}
      <div class="bg-sidebar rounded-xl border border-border-light-1 p-4">
        <h4 class="text-sm font-semibold text-accent mb-3">Quick Convert</h4>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-text/70">Degrees:</span>
            <span class="font-mono">
              {isValidNumber() ? `${currentNum().toFixed(2)}°` : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Radians:</span>
            <span class="font-mono">
              {isValidNumber() ? (currentNum() * Math.PI / 180).toFixed(6) : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Fahrenheit:</span>
            <span class="font-mono">
              {isValidNumber() ? (currentNum() * 9/5 + 32).toFixed(2) + '°F' : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div class="bg-sidebar rounded-xl border border-border-light-1 p-4">
        <h4 class="text-sm font-semibold text-accent mb-3">Info</h4>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-text/70">Calculations:</span>
            <span>{props.historyLength}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Mode:</span>
            <span>{props.angleMode()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text/70">Memory:</span>
            <span>{props.memoryValue() !== 0 ? 'Used' : 'Empty'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanels;