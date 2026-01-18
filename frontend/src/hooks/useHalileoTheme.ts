import { useEffect } from 'react';

/**
 * Halileo Theme Hook
 * When Halileo is active (thinking/guiding), it shifts the entire app's
 * accent colors to Halileo's indigo palette, making the AI feel integrated
 */
export const useHalileoTheme = (isActive: boolean) => {
    useEffect(() => {
        const root = document.documentElement;

        if (isActive) {
            // When Halileo is active, the "accent" color shifts to Halileo's Indigo
            root.style.setProperty('--color-brand-primary', 'var(--halileo-primary)');
            root.style.setProperty('--shadow-glow', '0 0 20px var(--halileo-glow)');
            root.setAttribute('data-halileo-active', 'true');
        } else {
            // Revert to standard brand color (handled by your existing brand theme logic)
            root.style.removeProperty('--shadow-glow');
            root.removeAttribute('data-halileo-active');
        }

        return () => {
            // Cleanup on unmount
            root.style.removeProperty('--shadow-glow');
            root.removeAttribute('data-halileo-active');
        };
    }, [isActive]);
};
