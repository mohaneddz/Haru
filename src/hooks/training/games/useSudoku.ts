import { createSignal, createEffect } from 'solid-js';

export default function useSudoku() {
	const [isPaused, setIsPaused] = createSignal(false);
	const [timeElapsed, setTimeElapsed] = createSignal(0);
	const [hintsUsed, setHintsUsed] = createSignal(0);
	const [selectedCell, setSelectedCell] = createSignal<{ row: number; col: number } | null>(null);
	const initialBoard = Array(9)
		.fill(0)
		.map(() => Array(9).fill(0));

	const [board, setBoard] = createSignal([...initialBoard]);
	const [solutionBoard, setSolutionBoard] = createSignal([...initialBoard]);
	const [solidCells, setSolidCells] = createSignal(
		Array(9)
			.fill(0)
			.map(() => Array(9).fill(false))
	);
	const [hintCells, setHintCells] = createSignal(
		Array(9)
			.fill(0)
			.map(() => Array(9).fill(false))
	);
	const [errorCells, setErrorCells] = createSignal(
		Array(9)
			.fill(0)
			.map(() => Array(9).fill(false))
	);
	const [isWon, setIsWon] = createSignal(false);
	const [finalTime, setFinalTime] = createSignal(0);

	// Timer logic
	createEffect(() => {
		if (!isPaused() && !isWon()) {
			const interval = setInterval(() => {
				setTimeElapsed((prev) => prev + 1);
			}, 1000);
			return () => clearInterval(interval);
		}
	});

	// Validation effect - runs whenever board changes
	createEffect(() => {
		const currentBoard = board();
		const errorMatrix = Array(9).fill(0).map(() => Array(9).fill(false));
		let hasErrors = false;

		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const cellValue = currentBoard[row][col];
				if (cellValue !== 0) {
					// Check if this cell has duplicates
					if (ScanHorizontal(currentBoard, row, cellValue, col) ||
						ScanVertical(currentBoard, col, cellValue, row) ||
						ScanBox(currentBoard, row, col, cellValue)) {
						errorMatrix[row][col] = true;
						hasErrors = true;
					}
				}
			}
		}

		setErrorCells(errorMatrix);

		// Check for win condition
		if (!hasErrors) {
			const isComplete = currentBoard.every(row => 
				row.every(cell => cell !== 0)
			);
			
			if (isComplete && !isWon()) {
				setFinalTime(timeElapsed()); // Store the final time
				setIsWon(true);
				setIsPaused(true); 
			}
		}
	});

	const ScanHorizontal = (board: number[][], row: number, num: number, excludeCol?: number): boolean => {
		let count = 0;
		for (let col = 0; col < 9; col++) {
			if (col !== excludeCol && board[row][col] === num) {
				count++;
			}
		}
		return count > 0;
	};

	const ScanVertical = (board: number[][], col: number, num: number, excludeRow?: number): boolean => {
		let count = 0;
		for (let row = 0; row < 9; row++) {
			if (row !== excludeRow && board[row][col] === num) {
				count++;
			}
		}
		return count > 0;
	};

	const ScanBox = (board: number[][], row: number, col: number, num: number): boolean => {
		const startRow = row - (row % 3);
		const startCol = col - (col % 3);
		let count = 0;
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				const currentRow = startRow + i;
				const currentCol = startCol + j;
				if (!(currentRow === row && currentCol === col) && 
					board[currentRow][currentCol] === num) {
					count++;
				}
			}
		}
		return count > 0;
	};

	const generatePerfectBoard = (hiddenPercentage: number) => {
		// Create a complete valid Sudoku board
		const completeBoard = Array(9).fill(0).map(() => Array(9).fill(0));
		
		// Fill the board with a valid solution (more sparse generation)
		const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
			// Check row
			for (let x = 0; x < 9; x++) {
				if (board[row][x] === num) return false;
			}
			
			// Check column
			for (let x = 0; x < 9; x++) {
				if (board[x][col] === num) return false;
			}
			
			// Check 3x3 box
			const startRow = row - (row % 3);
			const startCol = col - (col % 3);
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					if (board[i + startRow][j + startCol] === num) return false;
				}
			}
			
			return true;
		};
		
		const fillBoard = (board: number[][]): boolean => {
			const emptyCells = [];
			for (let row = 0; row < 9; row++) {
				for (let col = 0; col < 9; col++) {
					if (board[row][col] === 0) {
						emptyCells.push({row, col});
					}
				}
			}
			
			if (emptyCells.length === 0) return true;
			
			// Sort by constraint (cells with fewer possibilities first) for more sparse generation
			emptyCells.sort((a, b) => {
				const possibilitiesA = [1,2,3,4,5,6,7,8,9].filter(num => isValid(board, a.row, a.col, num)).length;
				const possibilitiesB = [1,2,3,4,5,6,7,8,9].filter(num => isValid(board, b.row, b.col, num)).length;
				return possibilitiesA - possibilitiesB;
			});
			
			const {row, col} = emptyCells[0];
			const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
			
			for (const num of numbers) {
				if (isValid(board, row, col, num)) {
					board[row][col] = num;
					
					if (fillBoard(board)) {
						return true;
					}
					
					board[row][col] = 0;
				}
			}
			return false;
		};
		
		// Generate complete board
		fillBoard(completeBoard);
		
		// Create visible board - start with complete solution
		const visibleBoard = completeBoard.map(row => [...row]);
		const solidMatrix = Array(9).fill(0).map(() => Array(9).fill(true));
		const totalCells = 81;
		const cellsToHide = Math.floor(totalCells * hiddenPercentage / 100);
		
		// Get all cell positions and shuffle them
		const cellPositions: Array<{row: number, col: number}> = [];
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				cellPositions.push({row, col});
			}
		}
		cellPositions.sort(() => Math.random() - 0.5);
		
		// Hide the specified number of cells (make them editable)
		for (let i = 0; i < cellsToHide; i++) {
			const {row, col} = cellPositions[i];
			visibleBoard[row][col] = 0;
			solidMatrix[row][col] = false; // Mark as editable
		}
		
		// Update the board states
		setBoard(visibleBoard);
		setSolutionBoard(completeBoard);
		setSolidCells(solidMatrix);
		setHintCells(Array(9).fill(0).map(() => Array(9).fill(false)));
		
		// Reset game state
		setTimeElapsed(0);
		setHintsUsed(0);
		setSelectedCell(null);
		setIsWon(false);
		setFinalTime(0);
		
		return {
			puzzle: visibleBoard,
			solution: completeBoard
		};
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const handleCellClick = (row: number, col: number) => {
		if (!solidCells()[row][col]) {
			// Only allow editing non-solid cells
			setSelectedCell({ row, col });
		}
	};

	const handleNumberInput = (num: number) => {
		const selected = selectedCell();
		if (selected) {
			setBoard((prev) => {
				const newBoard = [...prev];
				newBoard[selected.row][selected.col] = num;
				return newBoard;
			});
		}
	};

	const handleHint = () => {
		setHintsUsed((prev) => prev + 1);
		
		// Find all non-solid cells that can be filled (including wrong ones)
		const availableCells: Array<{row: number, col: number}> = [];
		const currentBoard = board();
		const solution = solutionBoard();
		
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				// Include any non-solid cell that doesn't match the solution
				if (!solidCells()[row][col] && currentBoard[row][col] !== solution[row][col]) {
					availableCells.push({row, col});
				}
			}
		}
		
		if (availableCells.length > 0) {
			// Pick a random available cell
			const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
			const {row, col} = randomCell;
			
			// Fill it with the solution value
			setBoard(prev => {
				const newBoard = [...prev];
				newBoard[row][col] = solution[row][col];
				return newBoard;
			});
			
			// Mark it as a hint cell (green border)
			setHintCells(prev => {
				const newHints = prev.map(row => [...row]);
				newHints[row][col] = true;
				return newHints;
			});
			
			// Make it solid so it can't be edited
			setSolidCells(prev => {
				const newSolid = prev.map(row => [...row]);
				newSolid[row][col] = true;
				return newSolid;
			});
		}
	};

	const handleReset = () => {
		setBoard((prev) => {
			const newBoard = prev.map((row, rowIndex) =>
				row.map((cell, colIndex) => {
					return solidCells()[rowIndex][colIndex] ? cell : 0;
				})
			);
			return newBoard;
		});
		// setTimeElapsed(0);
		// setHintsUsed(0);
		setSelectedCell(null);
	};

	const handleKeyboard = (event: KeyboardEvent) => {
		const selected = selectedCell();
		if (selected) {
			let { row, col } = selected;
			
			// Helper function to find next available cell in a direction
			const findNextAvailableCell = (startRow: number, startCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
				let newRow = startRow;
				let newCol = startCol;
				
				for (let i = 0; i < 9; i++) {
					switch (direction) {
						case 'up':
							newRow = (newRow - 1 + 9) % 9;
							break;
						case 'down':
							newRow = (newRow + 1) % 9;
							break;
						case 'left':
							newCol = (newCol - 1 + 9) % 9;
							break;
						case 'right':
							newCol = (newCol + 1) % 9;
							break;
					}
					
					// If we found an editable cell (not solid), return it
					if (!solidCells()[newRow][newCol]) {
						return { row: newRow, col: newCol };
					}
					
					// If we've cycled back to the starting position, no available cell found
					if (newRow === startRow && newCol === startCol) {
						break;
					}
				}
				
				// Return original position if no available cell found
				return { row: startRow, col: startCol };
			};
			
			switch (event.key) {
				case 'ArrowUp':
					event.preventDefault();
					const upCell = findNextAvailableCell(row, col, 'up');
					row = upCell.row;
					col = upCell.col;
					break;
				case 'ArrowDown':
					event.preventDefault();
					const downCell = findNextAvailableCell(row, col, 'down');
					row = downCell.row;
					col = downCell.col;
					break;
				case 'ArrowLeft':
					event.preventDefault();
					const leftCell = findNextAvailableCell(row, col, 'left');
					row = leftCell.row;
					col = leftCell.col;
					break;
				case 'ArrowRight':
					event.preventDefault();
					const rightCell = findNextAvailableCell(row, col, 'right');
					row = rightCell.row;
					col = rightCell.col;
					break;
				// now if it's a number key, set that number in the cell
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					const num = parseInt(event.key);
					if (!isNaN(num)) {
						handleNumberInput(num);
					}
					break;
			}
			setSelectedCell({ row, col });
		}
	};

	return {
		isPaused,
		setIsPaused,
		timeElapsed,
		formatTime,
		hintsUsed,
		selectedCell,
		setSelectedCell,
		handleKeyboard,
		board,
		solidCells,
		hintCells,
		errorCells,
		isWon,
		setIsWon,
		finalTime,
		handleCellClick,
		handleNumberInput,
		handleHint,
		handleReset,
		generatePerfectBoard,
	};
}
