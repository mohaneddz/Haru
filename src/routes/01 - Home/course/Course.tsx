import UpperNavigation from "@/layout/UpperNavigation";

const tabs = ['Overview', 'Syllabus', 'Resources', 'Progress'];

export default function Course(props: any) {
    return (
        <div class="w-full h-full flex flex-col items-center justify-start">

            <UpperNavigation tabs={tabs} />

            <div class="flex flex-col items-center justify-start h-full w-full bg-background-dark-2">
            </div>
        </div>
    );
};
