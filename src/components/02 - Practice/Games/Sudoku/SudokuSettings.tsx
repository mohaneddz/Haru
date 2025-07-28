// TODO: Implement actual settings functionality

import Button from "@/components/core/Input/Button";
import { ArrowLeft, Save } from "lucide-solid";

interface Props {
    setSudokuPage: (page: 'menu' | 'play' | 'settings') => void;
}

export default function SudokuSettings(props: Props) {

    const handleBack = () => {
        props.setSudokuPage('menu');
    };
    const handleSave = () => {
        console.log("Settings saved");
    };
    return (
        <div class="center flex-col h-full w-full max-x-md ">

            <div class=" bg-background-light-3 rounded-xl px-8 py-12 w-86 aspect-[3/4] center flex-col">

                <h1 class="text-2xl text-gray/40 text-center font-bold mb-4">Settings</h1>
                <p class="text-lg text-center">Adjust your preferences</p>

                <div class="flex flex-col items-stretch mt-4 gap-4">

                    <Button variant="ghost" class="center w-40" onClick={handleBack}>
                        <ArrowLeft class="mr-2" /> BACK
                    </Button>
                    <Button variant="primary" class="center w-40" onClick={handleSave}>
                        <Save class="mr-2" />
                        Save
                    </Button>

                </div>

            </div>
        </div>
    );
};
