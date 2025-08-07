import SudokuMenu from "@/components/02 - Practice/Games/Sudoku/SudokuMenu";
import SudokuGame from "@/components/02 - Practice/Games/Sudoku/SudokuGame";
import SudokuSettings from "@/components/02 - Practice/Games/Sudoku/SudokuSettings";
import { createSignal } from "solid-js";

export default function Sudoku() {

    const [sudokuPage, setSudokuPage] = createSignal<'menu' | 'play' | 'settings' >('menu')

    return (
        <div class="center h-full w-full">
            {sudokuPage() === 'menu' && <SudokuMenu setSudokuPage={setSudokuPage} />}
            {sudokuPage() === 'play' && <SudokuGame setSudokuPage={setSudokuPage} />}
            {sudokuPage() === 'settings' && <SudokuSettings setSudokuPage={setSudokuPage} />}
        </div>
    );

};
