import { createSignal } from 'solid-js';
import { AngleMode, Operation, ScientificFunction, Constant } from '@/types/tools/calculator';
import { toRadians, toDegrees, factorial } from '@/utils/math/mathUtils';
import { mathematicalConstants } from '@/utils/math/constants';
import { getOperationSymbol } from '@/utils/misc/operationUtils';

export function useCalculator() {
  const [display, setDisplay] = createSignal('0');
  const [previousValue, setPreviousValue] = createSignal<number | null>(null);
  const [operation, setOperation] = createSignal<Operation | null>(null);
  const [waitingForOperand, setWaitingForOperand] = createSignal(false);
  const [memory, setMemory] = createSignal(0);
  const [angleMode, setAngleMode] = createSignal<AngleMode>('DEG');
  const [history, setHistory] = createSignal<string[]>([]);

  // Utility functions for angle conversion
  const applyAngleConversion = (value: number) => {
    return angleMode() === 'DEG' ? toRadians(value) : value;
  };

  const applyInverseAngleConversion = (value: number) => {
    return angleMode() === 'DEG' ? toDegrees(value) : value;
  };

  // History management
  const addToHistory = (calculation: string) => {
    setHistory(prev => [calculation, ...prev.slice(0, 9)]); // Keep last 10 entries
  };
  const clearHistory = () => setHistory([]);

  // Input handling
  const handleNumberClick = (num: string) => {
    if (waitingForOperand()) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      // Prevent multiple leading zeros
      if (display() === '0' && num === '0') return;
      // Replace leading zero if a non-zero digit is pressed
      setDisplay(prev => prev === '0' && num !== '.' ? num : prev + num);
    }
  };

  const handleDecimalClick = () => {
    if (waitingForOperand()) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display().indexOf('.') === -1) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleClearEntry = () => {
    setDisplay('0');
    setWaitingForOperand(true);
  };

  // Core calculation logic
  const calculate = (firstValue: number, secondValue: number, op: Operation): number | null => {
    switch (op) {
      case 'add': return firstValue + secondValue;
      case 'subtract': return firstValue - secondValue;
      case 'multiply': return firstValue * secondValue;
      case 'divide': return secondValue !== 0 ? firstValue / secondValue : null;
      case 'power': return Math.pow(firstValue, secondValue);
      case 'root': return secondValue !== 0 ? Math.pow(firstValue, 1 / secondValue) : null;
      case 'mod': return firstValue % secondValue;
      default: return null;
    }
  };

  const handleOperationClick = (nextOp?: Operation) => {
    const inputValue = parseFloat(display());
    const prevValue = previousValue();

    if (prevValue === null) {
      setPreviousValue(inputValue);
    } else if (operation()) {
      const currentOperation = operation()!;
      const newValue = calculate(prevValue, inputValue, currentOperation);
      
      if (newValue !== null) {
        const result = String(newValue);
        const calculation = `${prevValue} ${getOperationSymbol(currentOperation)} ${inputValue} = ${result}`;
        addToHistory(calculation);
        
        setDisplay(result);
        setPreviousValue(newValue);
      } else {
        setDisplay('Error'); // Handle division by zero or invalid ops
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
        return;
      }
    }

    setWaitingForOperand(true);
    setOperation(nextOp || null);
  };

  const handleEquals = () => {
    if (operation() && previousValue() !== null) {
      const inputValue = parseFloat(display());
      const currentOperation = operation()!;
      const newValue = calculate(previousValue()!, inputValue, currentOperation);

      if (newValue !== null && !isNaN(newValue) && isFinite(newValue)) {
        const result = String(newValue);
        const calculation = `${previousValue()} ${getOperationSymbol(currentOperation)} ${inputValue} = ${result}`;
        addToHistory(calculation);
        
        setDisplay(result);
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(true);
      } else {
        setDisplay('Error');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
      }
    }
  };

  // Scientific operations
  const handleScientificFunction = (func: ScientificFunction) => {
    const value = parseFloat(display());
    let result: number | null = null;
    let calculation = '';

    try {
      switch (func) {
        case 'sin':
          result = Math.sin(applyAngleConversion(value));
          calculation = `sin(${value}) = ${result}`;
          break;
        case 'cos':
          result = Math.cos(applyAngleConversion(value));
          calculation = `cos(${value}) = ${result}`;
          break;
        case 'tan':
          result = Math.tan(applyAngleConversion(value));
          calculation = `tan(${value}) = ${result}`;
          break;
        case 'asin':
          if (value >= -1 && value <= 1) {
            result = applyInverseAngleConversion(Math.asin(value));
            calculation = `arcsin(${value}) = ${result}`;
          } else { throw new Error('Domain Error'); }
          break;
        case 'acos':
          if (value >= -1 && value <= 1) {
            result = applyInverseAngleConversion(Math.acos(value));
            calculation = `arccos(${value}) = ${result}`;
          } else { throw new Error('Domain Error'); }
          break;
        case 'atan':
          result = applyInverseAngleConversion(Math.atan(value));
          calculation = `arctan(${value}) = ${result}`;
          break;
        case 'sinh':
          result = Math.sinh(value);
          calculation = `sinh(${value}) = ${result}`;
          break;
        case 'cosh':
          result = Math.cosh(value);
          calculation = `cosh(${value}) = ${result}`;
          break;
        case 'tanh':
          result = Math.tanh(value);
          calculation = `tanh(${value}) = ${result}`;
          break;
        case 'log':
          if (value > 0) {
            result = Math.log10(value);
            calculation = `log(${value}) = ${result}`;
          } else { throw new Error('Domain Error'); }
          break;
        case 'ln':
          if (value > 0) {
            result = Math.log(value);
            calculation = `ln(${value}) = ${result}`;
          } else { throw new Error('Domain Error'); }
          break;
        case 'exp':
          result = Math.exp(value);
          calculation = `exp(${value}) = ${result}`;
          break;
        case 'sqrt':
          if (value >= 0) {
            result = Math.sqrt(value);
            calculation = `√(${value}) = ${result}`;
          } else { throw new Error('Domain Error'); }
          break;
        case 'cbrt':
          result = Math.cbrt(value);
          calculation = `∛(${value}) = ${result}`;
          break;
        case 'square':
          result = value * value;
          calculation = `${value}² = ${result}`;
          break;
        case 'cube':
          result = value * value * value;
          calculation = `${value}³ = ${result}`;
          break;
        case 'reciprocal':
          if (value !== 0) {
            result = 1 / value;
            calculation = `1/${value} = ${result}`;
          } else { throw new Error('Divide by Zero'); }
          break;
        case 'factorial':
          if (value >= 0 && value === Math.floor(value) && value <= 170) {
            result = factorial(value);
            calculation = `${value}! = ${result}`;
          } else { throw new Error('Domain Error'); } // Factorial of negative or non-integer
          break;
        case 'abs':
          result = Math.abs(value);
          calculation = `|${value}| = ${result}`;
          break;
        case 'sign':
          result = Math.sign(value);
          calculation = `sign(${value}) = ${result}`;
          break;
      }

      if (result !== null && !isNaN(result) && isFinite(result)) {
        setDisplay(String(result));
        addToHistory(calculation);
        setWaitingForOperand(true);
      } else {
        setDisplay('Error');
      }
    } catch (e: any) {
      setDisplay(e.message || 'Error');
    }
    setPreviousValue(null);
    setOperation(null);
  };

  // Memory operations
  const handleMemoryRecall = () => {
    setDisplay(String(memory()));
    setWaitingForOperand(true);
  };

  const handleMemoryStore = () => {
    setMemory(parseFloat(display()));
  };

  const handleMemoryAdd = () => {
    setMemory(prev => prev + parseFloat(display()));
  };

  const handleMemorySubtract = () => {
    setMemory(prev => prev - parseFloat(display()));
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  // Insert constants
  const handleInsertConstant = (constant: Constant) => {
    const value = mathematicalConstants[constant];
    if (value !== undefined) {
      setDisplay(String(value));
      setWaitingForOperand(true);
    }
  };

  return {
    display,
    previousValue,
    operation,
    memory,
    angleMode,
    history,
    setDisplay,
    setAngleMode,
    handleNumberClick,
    handleDecimalClick,
    handleClear,
    handleClearEntry,
    handleOperationClick,
    handleEquals,
    handleScientificFunction,
    handleMemoryRecall,
    handleMemoryStore,
    handleMemoryAdd,
    handleMemorySubtract,
    handleMemoryClear,
    handleInsertConstant,
    addToHistory,
    clearHistory,
    getOperationSymbol, 
  };
}