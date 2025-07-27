import Button from "@/components/core/Button";
import { ArrowLeft, Star, Cog } from "lucide-solid";
import { useNavigate } from "@solidjs/router";

interface Props {
    setSudokuPage: (page: 'menu' | 'play' | 'settings') => void;
}

export default function SudokuMenu(props: Props) {

    const navigate = useNavigate();

    const handleStart = () => {
        props.setSudokuPage('play');
    };

    const handleSettings = () => {
        props.setSudokuPage('settings');
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div class="center flex-col h-full w-full max-x-md ">

            <div class=" bg-background-light-3 rounded-xl px-8 py-12 w-86 aspect-[3/4] center flex-col">

                <h1 class="text-2xl text-gray/40 font-bold mb-4">Sudoku Menu</h1>
                <p class="text-lg text-center">Select Your Mode</p>

                <div class="flex flex-col items-stretch mt-4 gap-4">

                    <Button variant="primary" class="center w-40" onClick={handleStart}>
                        <Star class="mr-2" /> START
                    </Button>
                    <Button variant="secondary" class="center w-40" onClick={handleSettings}>
                        <Cog class="mr-2" /> SETTINGS
                    </Button>
                    <Button variant="ghost" class="center w-40" onClick={handleBack}>
                        <ArrowLeft class="mr-2" /> BACK
                    </Button>
                </div>

            </div>
        </div>
    );
};
