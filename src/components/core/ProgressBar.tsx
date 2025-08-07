interface Props {
    text: string;
    progress: number;
    color?: string;
    class?: string;
    showLabel?: boolean;
    orientation?: 'horizontal' | 'vertical';
}


export default function ProgressBar(props: Props) {
    const showLabel = props.showLabel !== false; // Default to true unless explicitly false
    
    if (!showLabel || props.text === '') {
        return (
            <div class={`flex items-center justify-center ${props.class || ''}`}>
                <div class="bg-accent-dark-3 w-full h-2 rounded-full overflow-hidden">
                    <div class={`bg-accent-light-1 h-full transition-all duration-300`} style={{ width: `${props.progress}%` }}></div>
                </div>
            </div>
        );
    }

    return (
        <div class={`flex flex-col w-full gap-1 ${props.class || ''}`}>
            <label class="text-sm text-start text-nowrap text-gray-400">{props.text}</label>
            <div class="bg-accent-dark-3 w-full h-2 rounded-full overflow-hidden">
                <div class={`bg-accent-light-1 h-full transition-all duration-300`} style={{ width: `${props.progress}%` }}></div>
            </div>
        </div>
    );
};
