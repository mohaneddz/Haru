import { Component, Accessor } from 'solid-js';
import { Operation } from '@/types/calculator';

interface DisplayProps {
  displayValue: Accessor<string>;
  previousValue: Accessor<number | null>;
  operation: Accessor<Operation | null>;
  memoryValue: Accessor<number>;
  getOperationSymbol: (op: Operation) => string;
}

const Display: Component<DisplayProps> = (props) => {
  return (
    <div class="mb-6">
      <div class="bg-background-light-1 rounded-lg p-4 border border-border-light-1">
        <div class="text-right">
          <div class="text-xs text-text/50 mb-1 h-4">
            {props.previousValue() !== null && props.operation() && (
              <span>{props.previousValue()} {props.getOperationSymbol(props.operation()!)}</span>
            )}
          </div>
          <div class="text-3xl font-mono text-accent overflow-hidden whitespace-nowrap overflow-x-auto no-scrollbar">
            {props.displayValue()}
          </div>
        </div>
      </div>
      {props.memoryValue() !== 0 && (
        <div class="text-xs text-accent mt-2">
          Memory: {props.memoryValue()}
        </div>
      )}
    </div>
  );
};

export default Display;