import { createSignal, Show, onCleanup, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Link from 'lucide-solid/icons/link';

interface Props {
    title: string;
    description: string;
    link?: string;
    onClick?: () => void;
    tags?: string[];
}

export default function ToolCard(props: Props) {
    const [isHovered, setIsHovered] = createSignal(false);
    const [previewLoaded, setPreviewLoaded] = createSignal(false);
    const [previewError, setPreviewError] = createSignal(false);
    const navigate = useNavigate();

    let hoverTimeout: number | undefined;

    const handleClick = async () => {
        if (props.link) {
            try {
                navigate(`/webview?url=${encodeURIComponent(props.link)}`);
            } catch (error) {
                console.error('Failed to navigate:', error);
            }
        }

        if (props.onClick) {
            props.onClick();
        }
    };

    const getPreviewUrl = () => {
        if (!props.link) return '';

        return `https://image.thum.io/get/width/400/crop/600/allowJPG/wait/20/noanimate/${props.link}`;
    };

    const handleMouseEnter = () => {
        // Add a small delay to prevent flickering on quick mouse movements
        hoverTimeout = window.setTimeout(() => {
            setIsHovered(true);
            setPreviewLoaded(false);
            setPreviewError(false);
        }, 200);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        setIsHovered(false);
        setPreviewLoaded(false);
        setPreviewError(false);
    };

    onCleanup(() => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
    });

    return (
        <div class="relative">
            {/* Preview Tooltip */}
            <Show when={isHovered() && props.link}>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 w-80">
                        {/* Preview Image */}
                        <div class="relative w-full h-48 bg-gray-800 rounded-md overflow-hidden mb-3">
                            <Show when={!previewError()}>
                                <img
                                    src={getPreviewUrl()}
                                    alt="Website preview"
                                    class={`w-full h-full object-cover transition-opacity duration-300 ${previewLoaded() ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setPreviewLoaded(true)}
                                    onError={() => {
                                        setPreviewError(true);
                                        setPreviewLoaded(false);
                                    }}
                                />
                            </Show>

                            {/* Loading State */}
                            <Show when={!previewLoaded() && !previewError()}>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            </Show>

                            {/* Error State */}
                            <Show when={previewError()}>
                                <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <svg class="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="text-xs">Preview unavailable</span>
                                </div>
                            </Show>

                            {/* Gradient overlay */}
                            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>

                        {/* Preview Content */}
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-blue-400 text-xs">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="truncate">{new URL(props.link || '').hostname}</span>
                            </div>
                        </div>

                        {/* Tooltip Arrow */}
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2">
                            <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-700"></div>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Main Card */}
            <div
                class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <h3 class="text-lg font-semibold text-text mb-2">{props.title}</h3>
                <p class="text-text/70 text-sm mb-3 line-clamp-2">{props.description}</p>

                {/* Tags */}
                {props.tags && props.tags.length > 0 && (
                    <div class="flex flex-wrap gap-1 mb-2">
                        <For each={props.tags.slice(0, 3)}>
                            {(tag) => (
                                <span class="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                                    {tag}
                                </span>
                            )}
                        </For>
                        {props.tags.length > 3 && (
                            <span class="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                +{props.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Optional: Show a small indicator if there's a link */}
                <Show when={props.link}>
                    <div class="mt-2 flex items-center gap-1 text-primary-light-3 text-xs">
                        <Link class="w-3 h-3 text-accent" />
                        <span class='truncate max-w-[80%]'>{props.link}</span>
                    </div>
                </Show>
            </div>
        </div>
    );
};