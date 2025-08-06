import { createSignal, onMount } from 'solid-js';
import { setStoreValue, getStoreValue } from '@/config/store';

export default function useAppearance() {
    const [theme, setTheme] = createSignal('default');
    const [fontSize, setFontSize] = createSignal(1.0); 
    const [font, setFont] = createSignal('Arial');
    const [initialPage, setInitialPage] = createSignal('home');

    // Get base font size from CSS
    const getBaseFontSize = () => {
        const computedStyle = window.getComputedStyle(document.documentElement);
        return parseFloat(computedStyle.fontSize);
    };

    onMount(async () => {
        const storedTheme = await getStoreValue('theme');
        const storedFontSize = await getStoreValue('fontSize');
        const storedFont = await getStoreValue('font');
        const storedInitialPage = await getStoreValue('initialPage');

        // Set defaults if no stored values
        if (!storedFontSize) {
            setFontSize(1.0); // Default to 100% scale
        }
        if (storedTheme && typeof storedTheme === 'string') setTheme(storedTheme);
        if (storedFontSize && typeof storedFontSize === 'number') setFontSize(storedFontSize);
        if (storedFont && typeof storedFont === 'string') setFont(storedFont);
        if (storedInitialPage && typeof storedInitialPage === 'string') setInitialPage(storedInitialPage);

        console.log(`Current font scale:`, fontSize());
        console.log(`Base font size:`, getBaseFontSize());

        updateAppearence();
    });

    const saveSettings = async () => {
        await setStoreValue('theme', theme());
        await setStoreValue('fontSize', fontSize());
        await setStoreValue('font', font());
        await setStoreValue('initialPage', initialPage());

        updateAppearence();
    };

    const updateAppearence = async () => {
        // Apply theme class
        document.documentElement.className = `theme-${theme()}`;
        
        // Apply font scaling to root element using CSS custom property
        document.documentElement.style.setProperty('--font-scale', fontSize().toString());
        
        // Apply font family to body
        const body = document.querySelector('body');
        if (body) body.style.fontFamily = font();
    };

    // Helper functions for font size adjustment
    const increaseFontSize = () => {
        const newSize = Math.min(fontSize() + 0.1, 2.0); // Max 200%
        setFontSize(newSize);
        saveSettings();
    };

    const decreaseFontSize = () => {
        const newSize = Math.max(fontSize() - 0.1, 0.5); // Min 50%
        setFontSize(newSize);
        saveSettings();
    };

    const resetFontSize = () => {
        setFontSize(1.0);
        saveSettings();
    };

    return {
        theme,
        setTheme,
        fontSize,
        setFontSize,
        font,
        setFont,
        initialPage,
        setInitialPage,
        updateAppearence,
        saveSettings,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        getBaseFontSize,
    };
};