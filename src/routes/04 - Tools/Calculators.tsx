// TODO : FIX KEYBOARD DOUBLE PRESS ISSUE! 

import { createSignal } from 'solid-js';
import * as LucideIcons from 'lucide-solid';

import { useCalculator } from '@/hooks/useCalculator';
import { useCalculatorKeyboard } from '@/hooks/useCalculatorKeyboard';
import Display from '@/components/04 - Tools/Calculator/CalculatorDisplay';
import Keypad from '@/components/04 - Tools/Calculator/CalculatorKeypad';
import ScientificKeypad from '@/components/04 - Tools/Calculator/CalculatorScientificKeypad';
import HistoryPanel from '@/components/04 - Tools/Calculator/CalculatorHistoryPanel';
import InfoPanels from '@/components/04 - Tools/Calculator/CalculatorInfoPanels';

export default function Calculators() {
  const {
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
    clearHistory,
    getOperationSymbol,
  } = useCalculator();

  const [scientificVisible, setScientificVisible] = createSignal(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = createSignal(false);

  // Type-safe wrapper functions for keyboard handler
  const keyboardHandlers = {
    handleNumberClick,
    handleDecimalClick,
    handleClear,
    handleClearEntry,
    handleOperationClick: (op: string) => handleOperationClick(op as any),
    handleEquals,
    handleScientificFunction: (func: string) => handleScientificFunction(func as any),
    handleMemoryRecall,
    handleMemoryStore,
    handleMemoryAdd,
    handleMemorySubtract,
    handleMemoryClear,
    handleInsertConstant: (constant: string) => handleInsertConstant(constant as any),
    setAngleMode,
    angleMode
  };

  // Initialize keyboard support
  const keyboardUtils = useCalculatorKeyboard(keyboardHandlers);

  // Helper for history item click
  const handleHistorySelect = (result: string) => {
    setDisplay(result);
  };

  return (
    <div class="h-full w-full bg-background text-text p-6 overflow-hidden">
      <div class="mx-16 flex flex-col gap-6 h-full"> {/* Increased max-width and added flex column gap */}

        {/* Header */}
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <LucideIcons.Calculator class="w-8 h-8 text-accent z-50" />
            <h1 class="text-2xl font-bold text-accent z-50">Scientific Calculator</h1>
          </div>
          <div class="flex items-center gap-3 z-50">
            <button
              class={`px-3 py-1 rounded-md text-xs transition-colors ${angleMode() === 'DEG'
                  ? 'bg-accent text-background'
                  : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'
                }`}
              onClick={() => setAngleMode(angleMode() === 'DEG' ? 'RAD' : 'DEG')}
            >
              {angleMode()}
            </button>

            <button
              class="px-3 py-1 rounded-md text-xs bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3 transition-colors"
              onClick={() => setScientificVisible(!scientificVisible())}
            >
              {scientificVisible() ? 'Hide Scientific' : 'Show Scientific'}
            </button>

            <button
              class="px-3 py-1 rounded-md text-xs bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1"
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp())}
            >
              <LucideIcons.Keyboard class="w-3 h-3" />
              Shortcuts
            </button>
          </div>        </div>

        {/* Keyboard Help Modal */}
        {showKeyboardHelp() && (
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-sidebar rounded-xl border border-border-light-1 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-accent flex items-center gap-2">
                  <LucideIcons.Keyboard class="w-6 h-6" />
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  class="text-text/70 hover:text-text transition-colors"
                >
                  <LucideIcons.X class="w-6 h-6" />
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(keyboardUtils.getKeyboardShortcuts()).map(([category, shortcuts]) => (
                  <div class="bg-background-light-1 rounded-lg p-4">
                    <h3 class="text-sm font-semibold text-accent mb-3 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div class="space-y-2">
                      {Object.entries(shortcuts as Record<string, string>).map(([key, description]) => (
                        <div class="flex justify-between items-center text-xs">
                          <kbd class="px-2 py-1 bg-sidebar-light-2 text-accent rounded font-mono">
                            {key}
                          </kbd>
                          <span class="text-text/70 ml-2">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div class="mt-6 p-4 bg-background-light-1 rounded-lg">
                <h4 class="text-sm font-semibold text-accent mb-2">Tips:</h4>
                <ul class="text-xs text-text/70 space-y-1">
                  <li>• Use the numeric keypad for faster number input</li>
                  <li>• Hold Shift for inverse trigonometric functions</li>
                  <li>• Hold Alt for hyperbolic functions</li>
                  <li>• Hold Ctrl for memory operations</li>
                  <li>• Use function keys F1-F12 for quick access to common functions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Additional Tools */}
        <InfoPanels
          displayValue={display}
          angleMode={angleMode}
          historyLength={history().length}
          memoryValue={memory}
        />

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full w-full overflow-hidden">

          {/* Main Calculator */}
          <div class="lg:col-span-2">
            <div class="bg-sidebar rounded-xl border border-border-light-1 p-6 h-full">
              <Display
                displayValue={display}
                previousValue={previousValue}
                operation={operation}
                memoryValue={memory}
                getOperationSymbol={getOperationSymbol}
              />
              <Keypad
                handleNumberClick={handleNumberClick}
                handleDecimalClick={handleDecimalClick}
                handleClear={handleClear}
                handleClearEntry={handleClearEntry}
                handleOperationClick={handleOperationClick}
                handleEquals={handleEquals}
              />
            </div>
          </div>

          {/* Scientific Functions */}
          {scientificVisible() && (
            <div class="lg:col-span-3 row-span-2 overflow-hidden">
              <ScientificKeypad
                handleScientificFunction={handleScientificFunction}
                handleInsertConstant={handleInsertConstant}
                handleMemoryRecall={handleMemoryRecall}
                handleMemoryStore={handleMemoryStore}
                handleMemoryAdd={handleMemoryAdd}
                handleMemorySubtract={handleMemorySubtract}
                handleMemoryClear={handleMemoryClear}
                handleOperationClick={handleOperationClick} // Pass basic ops needed for power/root
              />
            </div>
          )}

          {/* History */}
          <div class={`${'lg:col-span-2 h-full overflow-hidden'}`}>
            <HistoryPanel
              history={history}
              clearHistory={clearHistory}
              onSelectHistory={handleHistorySelect}
            />
          </div>
        </div>

      </div>
    </div>
  );
}