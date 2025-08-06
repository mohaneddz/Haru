import { useSearchParams } from '@solidjs/router';
import { createSignal, onMount } from 'solid-js';

export default function Webview() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = createSignal(true);
    
    // Handle the case where url might be an array or undefined
    const getUrl = () => {
        const urlParam = searchParams.url;
        if (Array.isArray(urlParam)) {
            return urlParam[0] || '';
        }
        return urlParam || '';
    };

    const url = getUrl();

    onMount(() => {
        // Simulate loading time
        setTimeout(() => setLoading(false), 1000);
    });

    return (
        <div class="h-full w-full flex flex-col">
            {/* Header with URL and controls */}
            <div class="bg-gray-800 border-b border-gray-700 p-4 flex items-center gap-4 pt-8 z-30">
                <button 
                    onClick={() => window.history.back()} 
                    class="text-text hover:text-gray-300 transition-colors"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <div class="flex-1 bg-gray-700 rounded-lg px-3 py-2">
                    <span class="text-gray-300 text-sm truncate">{url}</span>
                </div>
            </div>

            {/* Webview content */}
            <div class="flex-1 relative z-50">
                {loading() && (
                    <div class="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                            <p class="text-text">Loading website...</p>
                        </div>
                    </div>
                )}
                
                <iframe
                    src={url}
                    class="w-full h-full border-none"
                    onLoad={() => setLoading(false)}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
            </div>
        </div>
    );
}