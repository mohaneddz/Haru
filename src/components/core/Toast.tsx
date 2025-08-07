import { InfoIcon, TriangleAlert, XCircle } from "lucide-solid";
import { createSignal, onMount } from "solid-js";

interface Props {
    type: 'info' | 'error' | 'warning';
    message: string;
    duration?: number;
}

export default function Toast(props: Props) {
    const DURATION = props.duration || 3000;
    const [isVisible, setIsVisible] = createSignal(false);
    const [isExiting, setIsExiting] = createSignal(false);

    onMount(async () => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 50);
        
        if (DURATION) {
            setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    const toastElement = document.getElementById("toast");
                    toastElement && (toastElement.style.display = "none");
                }, 300); // Match the transition duration
            }, DURATION);
        }
    });

    return (
        <div 
            id="toast" 
            class={`fixed bottom-8 right-8 flex items-center justify-between p-4 shadow-md rounded-lg z-50 border-border border-[1px] transition-all duration-300 ease-in-out ` +
                (props.type === 'info' ? 'bg-sidebar text-accent' :
                    props.type === 'error' ? 'bg-error-dark-2/80 text-error' :
                        'bg-warning-dark-3/80 text-warning') + ' ' +
                (isVisible() && !isExiting() ? 'translate-x-0 opacity-100' : 
                 isExiting() ? 'translate-x-full opacity-0' : 
                 'translate-x-full opacity-0')
            }>

            {props.type === 'info' && <InfoIcon class="absolute top-2 left-2 w-6 h-6 text-accent" />}
            {props.type === 'error' && <XCircle class="absolute top-2 left-2 w-6 h-6 text-error" />}
            {props.type === 'warning' && <TriangleAlert class="absolute top-2 left-2 w-6 h-6 text-warning" />}

            <span class="ml-8 max-w-[20vw]">{props.message}</span>
        </div>
    );
};