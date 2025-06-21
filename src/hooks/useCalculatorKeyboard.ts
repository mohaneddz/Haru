import { onMount, onCleanup } from 'solid-js';

let globalListenerAttached = false;
let currentHandlers: CalculatorKeyboardHandlers | null = null;

export interface CalculatorKeyboardHandlers {
  handleNumberClick: (num: string) => void;
  handleDecimalClick: () => void;
  handleClear: () => void;
  handleClearEntry: () => void;
  handleOperationClick: (op: string) => void;
  handleEquals: () => void;
  handleScientificFunction: (func: string) => void;
  handleMemoryRecall: () => void;
  handleMemoryStore: () => void;
  handleMemoryAdd: () => void;
  handleMemorySubtract: () => void;
  handleMemoryClear: () => void;
  handleInsertConstant: (constant: string) => void;
  setAngleMode: (mode: 'DEG' | 'RAD') => void;
  angleMode: () => 'DEG' | 'RAD';
}

export function useCalculatorKeyboard(handlers: CalculatorKeyboardHandlers) {
  // Update current handlers
  currentHandlers = handlers;
  
  const handleKeyPress = (event: KeyboardEvent) => {
    if (!currentHandlers) return;
    
    const key = event.key;
    const isCtrl = event.ctrlKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;
    
    // Prevent default for calculator keys
    const calculatorKeys = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      '+', '-', '*', '/', '=', 'Enter', '.', 'Escape', 'Backspace', 'Delete',
      'c', 'C', 's', 'S', 't', 'T', 'l', 'L', 'e', 'E', 'p', 'P', 'r', 'R',
      'q', 'Q', 'w', 'W', 'x', 'X', 'y', 'Y', 'z', 'Z', 'a', 'A', 'n', 'N',
      'm', 'M', 'f', 'F', 'g', 'G', 'h', 'H', 'i', 'I', 'j', 'J', 'k', 'K'
    ];
    
    if (calculatorKeys.includes(key) || calculatorKeys.includes(key.toLowerCase())) {
      event.preventDefault();
    }

    // Numbers 0-9 - highest priority
    if (/^[0-9]$/.test(key)) {
      handlers.handleNumberClick(key);
      return;
    }

    // Basic Operations - handle these first to avoid conflicts
    switch (key) {
      case '+':
        handlers.handleOperationClick('add');
        return;
      case '-':
        if (!isShift) { // Regular minus, not underscore
          handlers.handleOperationClick('subtract');
        }
        return;
      case '*':
        handlers.handleOperationClick('multiply');
        return;
      case '/':
        handlers.handleOperationClick('divide');
        return;
      case '=':
      case 'Enter':
        handlers.handleEquals();
        return;
      case '.':
        handlers.handleDecimalClick();
        return;
      case 'Escape':
        handlers.handleClear();
        return;
      case 'Backspace':
      case 'Delete':
        handlers.handleClearEntry();
        return;
      case '%':
        handlers.handleOperationClick('mod');
        return;
      case '^':
        handlers.handleOperationClick('power');
        return;
    }

    // Handle modifier combinations first (highest priority)
    if (isCtrl) {
      switch (key.toLowerCase()) {
        case 'r':
          handlers.handleMemoryRecall();
          return;
        case 's':
          handlers.handleMemoryStore();
          return;
        case 'm':
          if (isShift) {
            handlers.handleMemorySubtract();
          } else {
            handlers.handleMemoryAdd();
          }
          return;
        case 'c':
          handlers.handleMemoryClear();
          return;
        case 'd':
          handlers.setAngleMode(handlers.angleMode() === 'DEG' ? 'RAD' : 'DEG');
          return;
      }
    }

    // Handle Alt combinations
    if (isAlt) {
      switch (key.toLowerCase()) {
        case 's':
          handlers.handleScientificFunction('sinh');
          return;
        case 'c':
          handlers.handleScientificFunction('cosh');
          return;
        case 't':
          handlers.handleScientificFunction('tanh');
          return;
      }
    }

    // Handle Shift combinations
    if (isShift) {
      switch (key) {
        case 'S':
          handlers.handleScientificFunction('asin');
          return;
        case 'C':
          handlers.handleScientificFunction('acos');
          return;
        case 'T':
          handlers.handleScientificFunction('atan');
          return;
        case 'L':
          handlers.handleScientificFunction('ln');
          return;
        case 'E':
          handlers.handleScientificFunction('exp');
          return;
        case 'Q':
          handlers.handleScientificFunction('cbrt');
          return;
        case 'X':
          handlers.handleScientificFunction('exp');
          return;
        case 'Y':
          handlers.handleOperationClick('root');
          return;
      }
    }

    // Handle regular letter keys (no modifiers)
    if (!isCtrl && !isShift && !isAlt) {
      switch (key.toLowerCase()) {
        case 's':
          handlers.handleScientificFunction('sin');
          return;
        case 'c':
          handlers.handleScientificFunction('cos');
          return;
        case 't':
          handlers.handleScientificFunction('tan');
          return;
        case 'l':
          handlers.handleScientificFunction('log');
          return;
        case 'e':
          handlers.handleInsertConstant('e');
          return;
        case 'q':
          handlers.handleScientificFunction('sqrt');
          return;
        case 'w':
          handlers.handleScientificFunction('square');
          return;
        case 'u':
          handlers.handleScientificFunction('cube');
          return;
        case 'x':
          handlers.handleOperationClick('multiply');
          return;
        case 'r':
          handlers.handleScientificFunction('reciprocal');
          return;
        case 'f':
          handlers.handleScientificFunction('factorial');
          return;
        case 'a':
          handlers.handleScientificFunction('abs');
          return;
        case 'n':
          handlers.handleScientificFunction('sign');
          return;
        case 'p':
          handlers.handleInsertConstant('pi');
          return;
        case 'g':
          handlers.handleInsertConstant('phi');
          return;
      }
    }
  };

  // Function key handlers
  const handleFunctionKeys = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'F1':
        event.preventDefault();
        handlers.handleScientificFunction('sin');
        break;
      case 'F2':
        event.preventDefault();
        handlers.handleScientificFunction('cos');
        break;
      case 'F3':
        event.preventDefault();
        handlers.handleScientificFunction('tan');
        break;
      case 'F4':
        event.preventDefault();
        handlers.handleScientificFunction('log');
        break;
      case 'F5':
        event.preventDefault();
        handlers.handleScientificFunction('ln');
        break;
      case 'F6':
        event.preventDefault();
        handlers.handleScientificFunction('exp');
        break;
      case 'F7':
        event.preventDefault();
        handlers.handleScientificFunction('sqrt');
        break;
      case 'F8':
        event.preventDefault();
        handlers.handleScientificFunction('square');
        break;
      case 'F9':
        event.preventDefault();
        handlers.handleInsertConstant('pi');
        break;
      case 'F10':
        event.preventDefault();
        handlers.handleInsertConstant('e');
        break;
      case 'F11':
        event.preventDefault();
        handlers.handleMemoryRecall();
        break;
      case 'F12':
        event.preventDefault();
        handlers.handleMemoryStore();
        break;
    }
  };

  // Numpad support
  const handleNumpadKeys = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'Numpad0':
      case 'Numpad1':
      case 'Numpad2':
      case 'Numpad3':
      case 'Numpad4':
      case 'Numpad5':
      case 'Numpad6':
      case 'Numpad7':
      case 'Numpad8':
      case 'Numpad9':
        event.preventDefault();
        handlers.handleNumberClick(event.key);
        break;
      case 'NumpadAdd':
        event.preventDefault();
        handlers.handleOperationClick('add');
        break;
      case 'NumpadSubtract':
        event.preventDefault();
        handlers.handleOperationClick('subtract');
        break;
      case 'NumpadMultiply':
        event.preventDefault();
        handlers.handleOperationClick('multiply');
        break;
      case 'NumpadDivide':
        event.preventDefault();
        handlers.handleOperationClick('divide');
        break;
      case 'NumpadDecimal':
        event.preventDefault();
        handlers.handleDecimalClick();
        break;
      case 'NumpadEnter':
        event.preventDefault();
        handlers.handleEquals();
        break;
    }
  };

  // Combined event handler
  const keydownHandler = (event: KeyboardEvent) => {
    handleKeyPress(event);
    handleFunctionKeys(event);
    handleNumpadKeys(event);  };

  // Set up event listeners - prevent duplicates
  onMount(() => {
    if (!globalListenerAttached) {
      document.addEventListener('keydown', keydownHandler);
      globalListenerAttached = true;
    }
    
    onCleanup(() => {
      if (globalListenerAttached) {
        document.removeEventListener('keydown', keydownHandler);
        globalListenerAttached = false;
        currentHandlers = null;
      }
    });
  });

  // Return keyboard mapping info for help/documentation
  return {
    getKeyboardShortcuts: () => ({
      numbers: {
        '0-9': 'Input numbers',
        'Numpad 0-9': 'Input numbers (numpad)',
        '.': 'Decimal point',
        'Numpad .': 'Decimal point (numpad)'
      },
      basicOperations: {
        '+': 'Addition',
        '-': 'Subtraction', 
        '*': 'Multiplication',
        '/': 'Division',
        '=': 'Equals',
        'Enter': 'Equals',
        '%': 'Modulo',
        '^': 'Power'
      },
      clearing: {
        'Escape': 'Clear all (C)',
        'Backspace': 'Clear entry (CE)',
        'Delete': 'Clear entry (CE)'
      },
      memory: {
        'Ctrl+R': 'Memory recall',
        'Ctrl+S': 'Memory store',
        'Ctrl+M': 'Memory add',
        'Ctrl+Shift+M': 'Memory subtract',
        'Ctrl+C': 'Memory clear'
      },
      trigonometric: {
        'S': 'Sine',
        'C': 'Cosine', 
        'T': 'Tangent',
        'Shift+S': 'Arcsine',
        'Shift+C': 'Arccosine',
        'Shift+T': 'Arctangent'
      },
      hyperbolic: {
        'Alt+S': 'Hyperbolic sine',
        'Alt+C': 'Hyperbolic cosine',
        'Alt+T': 'Hyperbolic tangent'
      },
      logarithmic: {
        'L': 'Log base 10',
        'Shift+L': 'Natural log (ln)',
        'E': 'Exponential (exp)',
        'Shift+E': 'Exponential (exp)'
      },
      powersAndRoots: {
        'Q': 'Square root',
        'Shift+Q': 'Cube root',
        'W': 'Square (x²)',
        'U': 'Cube (x³)',
        '^': 'Power (x^y)',
        'Shift+Y': 'Root (ˣ√y)'
      },
      special: {
        'R': 'Reciprocal (1/x)',
        'F': 'Factorial',
        'A': 'Absolute value',
        'N': 'Sign change (±)'
      },
      constants: {
        'P': 'Pi (π)',
        'E': 'Euler number (e)',
        'G': 'Golden ratio (φ)'
      },
      modes: {
        'Ctrl+D': 'Toggle DEG/RAD mode'
      },
      functionKeys: {
        'F1': 'Sine',
        'F2': 'Cosine',
        'F3': 'Tangent',
        'F4': 'Log',
        'F5': 'Natural log',
        'F6': 'Exponential',
        'F7': 'Square root',
        'F8': 'Square',
        'F9': 'Pi constant',
        'F10': 'Euler constant',
        'F11': 'Memory recall',
        'F12': 'Memory store'
      }
    })
  };
}
