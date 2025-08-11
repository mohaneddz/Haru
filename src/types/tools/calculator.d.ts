export type AngleMode = 'DEG' | 'RAD';

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'root' | 'mod';

export type ScientificFunction =
  | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan'
  | 'sinh' | 'cosh' | 'tanh'
  | 'log' | 'ln' | 'exp'
  | 'sqrt' | 'cbrt' | 'square' | 'cube'
  | 'reciprocal' | 'factorial' | 'abs' | 'sign';

export type Constant = 'pi' | 'e' | 'phi' | 'sqrt2' | 'ln10' | 'ln2';