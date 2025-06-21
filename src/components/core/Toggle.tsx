import { createSignal, createEffect } from 'solid-js';

interface Props {
    enabled?: boolean;
    onToggle?: (enabled: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
}

export default function Toggle(props: Props) {
    const [isEnabled, setIsEnabled] = createSignal(props.enabled || false);

    createEffect(() => {
        setIsEnabled(props.enabled || false);
    });

    const handleToggle = () => {
        if (!props.disabled) {
            const newState = !isEnabled();
            setIsEnabled(newState);
            if (props.onToggle) {
                props.onToggle(newState);
            }
        }
    };

    const sizeClasses = () => {
        switch (props.size) {
            case 'sm':
                return {
                    container: 'w-8 h-4',
                    thumb: 'w-3 h-3',
                    translate: 'translate-x-4'
                };
            case 'lg':
                return {
                    container: 'w-14 h-7',
                    thumb: 'w-6 h-6',
                    translate: 'translate-x-7'
                };
            default: // 'md'
                return {
                    container: 'w-11 h-6',
                    thumb: 'w-5 h-5',
                    translate: 'translate-x-5'
                };
        }
    };

    const classes = sizeClasses();

    return (
        <div class="flex items-center gap-3">
            <button
                onClick={handleToggle}
                disabled={props.disabled}
                class={`
                    relative inline-flex items-center ${classes.container} rounded-full
                    transition-colors duration-200 ease-in-out
                    ${isEnabled()
                        ? 'bg-accent hover:bg-accent/80'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }
                    ${props.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }
                `}
                aria-pressed={isEnabled()}
                aria-label={props.label || 'Toggle'}
            >
                <span
                    class={`
                        inline-block ${classes.thumb} rounded-full bg-white shadow-lg
                        transform transition-transform duration-200 ease-in-out
                        ${isEnabled() ? classes.translate : 'translate-x-0.5'}
                    `}
                />
            </button>

            {(props.label || props.description) && (
                <div class="flex flex-col">
                    {props.label && (
                        <span class={`text-sm font-medium ${props.disabled ? 'text-gray-500' : 'text-white'}`}>
                            {props.label}
                        </span>
                    )}
                    {props.description && (
                        <span class="text-xs text-gray-400">
                            {props.description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
