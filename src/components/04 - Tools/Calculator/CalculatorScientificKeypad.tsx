import { Component } from 'solid-js';
import CalculatorButton from '@/components/04 - Tools/Calculator/CalculatorButton';
import { ScientificFunction, Constant, Operation } from '@/types/tools/calculator';

interface ScientificKeypadProps {
  handleScientificFunction: (func: ScientificFunction) => void;
  handleInsertConstant: (constant: Constant) => void;
  handleMemoryRecall: () => void;
  handleMemoryStore: () => void;
  handleMemoryAdd: () => void;
  handleMemorySubtract: () => void;
  handleMemoryClear: () => void;
  handleOperationClick: (op: Operation) => void;
}

const ScientificKeypad: Component<ScientificKeypadProps> = (props) => {
  return (
    <div class="bg-sidebar rounded-xl border border-border-light-1 p-6 h-full w-full grid grid-rows-5 gap-4  py-8">

      <div class="flex flex-col w-full h-full overflow-hidden row-span-3">
        <h3 class="text-lg font-semibold text-accent mb-4">Functions</h3>
        <div class="grid grid-cols-6 gap-2 mb-4 h-full">
          {/* Trigonometric */}
          <CalculatorButton onClick={() => props.handleScientificFunction('sin')} variant="function">sin</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('cos')} variant="function">cos</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('tan')} variant="function">tan</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('asin')} variant="function">asin</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('acos')} variant="function">acos</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('atan')} variant="function">atan</CalculatorButton>

          {/* Hyperbolic */}
          <CalculatorButton onClick={() => props.handleScientificFunction('sinh')} variant="function">sinh</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('cosh')} variant="function">cosh</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('tanh')} variant="function">tanh</CalculatorButton>

          {/* Logarithmic */}
          <CalculatorButton onClick={() => props.handleScientificFunction('log')} variant="function">log</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('ln')} variant="function">ln</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('exp')} variant="function">exp</CalculatorButton>

          {/* Powers & Roots */}
          <CalculatorButton onClick={() => props.handleScientificFunction('square')} variant="function">x²</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('cube')} variant="function">x³</CalculatorButton>
          <CalculatorButton onClick={() => props.handleOperationClick('power')} variant="function">x^y</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('sqrt')} variant="function">√</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('cbrt')} variant="function">∛</CalculatorButton>
          <CalculatorButton onClick={() => props.handleOperationClick('root')} variant="function">ˣ√y</CalculatorButton>

          {/* Other */}
          <CalculatorButton onClick={() => props.handleScientificFunction('reciprocal')} variant="function">1/x</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('factorial')} variant="function">n!</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('abs')} variant="function">|x|</CalculatorButton>
          <CalculatorButton onClick={() => props.handleScientificFunction('sign')} variant="function">±</CalculatorButton>
        </div>
      </div>

      {/* Constants */}
      <div class="flex flex-col w-full h-full overflow-hidden">
        <h4 class="text-sm font-semibold text-text/70 mb-2">Constants</h4>
        <div class="grid grid-cols-4 gap-2 mb-4 h-full">
          <CalculatorButton onClick={() => props.handleInsertConstant('pi')} variant="special">π</CalculatorButton>
          <CalculatorButton onClick={() => props.handleInsertConstant('e')} variant="special">e</CalculatorButton>
          <CalculatorButton onClick={() => props.handleInsertConstant('phi')} variant="special">φ</CalculatorButton>
          <CalculatorButton onClick={() => props.handleInsertConstant('sqrt2')} variant="special">√2</CalculatorButton>
        </div>
      </div>

      {/* Memory */}
      <div class="flex flex-col w-full h-full overflow-hidden">
        <h4 class="text-sm font-semibold text-text/70 mb-2">Memory</h4>
        <div class="grid grid-cols-3 gap-2 h-full">
          <CalculatorButton onClick={props.handleMemoryRecall} variant="special">MR</CalculatorButton>
          <CalculatorButton onClick={props.handleMemoryStore} variant="special">MS</CalculatorButton>
          <CalculatorButton onClick={props.handleMemoryAdd} variant="special">M+</CalculatorButton>
          <CalculatorButton onClick={props.handleMemorySubtract} variant="special">M−</CalculatorButton>
          <CalculatorButton onClick={props.handleMemoryClear} variant="special" size="wide">MC</CalculatorButton>
        </div>
      </div>
    </div>
  );
};

export default ScientificKeypad;