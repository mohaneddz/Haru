import ProgressBar from '@/components/core/ProgressBar';

export default function Ranking() {
    return (

        <div class="relative w-full flex items-center justify-between z-50 h-40 bg-sidebar rounded-sm my-8 border-[0.5px] border-white/40 p-4">

            <div class="relative h-full w-full flex items-center">

                <div class="bg-sidebar mx-4 h-[90%] border-1 border-white/40 rounded flex aspect-square justify-center items-center text-5xl">2</div>

                <div class="flexflex-col">
                    <p class="text-accent text-3xl">Mohaned Manaa</p>
                    <p class="text-text-dark-2 text-lg">Desrtoyer of worlds</p>
                    <p class="text-text-dark-3/40 text-xs mb-2">50 pts until next level!</p>
                    <ProgressBar text="" progress={75} color="bg-accent-light-1" class="w-[200px] h-2" showLabel={false} />
                </div>

            </div>

        </div>
    );
};
