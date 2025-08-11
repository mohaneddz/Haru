import { Operation } from '../../types/tools/calculator';

export const getOperationSymbol = (op: Operation): string => {
  const symbols: Record<Operation, string> = {
    'add': '+',
    'subtract': '−',
    'multiply': '×',
    'divide': '÷',
    'power': '^',
    'root': 'ˣ√',
    'mod': 'mod'
  };
  return symbols[op] || op;
};