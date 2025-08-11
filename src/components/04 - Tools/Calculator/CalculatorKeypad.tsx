import { Component } from 'solid-js';
import CalculatorButton from './CalculatorButton';
import { Operation } from '@/types/tools/calculator';

interface KeypadProps {
  handleNumberClick: (num: string) => void;
  handleDecimalClick: () => void;
  handleClear: () => void;
  handleClearEntry: () => void;
  handleOperationClick: (op: Operation) => void;
  handleEquals: () => void;
}

const Keypad: Component<KeypadProps> = (props) => {
  return (
    <div class="h-full w-full grid grid-cols-4 grid-rows-5 gap-3 py-8 overflow-hidden">
      {/* Row 1 */}
      <CalculatorButton  onClick={props.handleClear} variant="special">C</CalculatorButton>
      <CalculatorButton  onClick={props.handleClearEntry} variant="special">CE</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleOperationClick('mod')} variant="operator">mod</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleOperationClick('divide')} variant="operator">÷</CalculatorButton>

      {/* Row 2 */}
      <CalculatorButton  onClick={() => props.handleNumberClick('7')} variant="number">7</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('8')} variant="number">8</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('9')} variant="number">9</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleOperationClick('multiply')} variant="operator">×</CalculatorButton>

      {/* Row 3 */}
      <CalculatorButton  onClick={() => props.handleNumberClick('4')} variant="number">4</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('5')} variant="number">5</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('6')} variant="number">6</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleOperationClick('subtract')} variant="operator">−</CalculatorButton>

      {/* Row 4 */}
      <CalculatorButton  onClick={() => props.handleNumberClick('1')} variant="number">1</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('2')} variant="number">2</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleNumberClick('3')} variant="number">3</CalculatorButton>
      <CalculatorButton  onClick={() => props.handleOperationClick('add')} variant="operator">+</CalculatorButton>

      {/* Row 5 */}
      <CalculatorButton  onClick={() => props.handleNumberClick('0')} variant="number" size="wide">0</CalculatorButton>
      <CalculatorButton  onClick={props.handleDecimalClick} variant="number">.</CalculatorButton>
      <CalculatorButton  onClick={props.handleEquals} variant="operator">=</CalculatorButton>
    </div>
  );
};

export default Keypad;