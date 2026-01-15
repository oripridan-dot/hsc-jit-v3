/**
 * Audio Feedback System
 * Provides subtle hardware-style UI sounds for pro audio aesthetic
 * 
 * Sound Design Philosophy:
 * - Click: Tactile relay/button press (50-80ms)
 * - Hover: Soft mechanical ratchet (30-50ms)
 * - Success: Warm analog confirmation (100-150ms)
 * - Error: Sharp digital alert (80-120ms)
 * 
 * All sounds are synthesized using Web Audio API to avoid external dependencies
 */

class AudioFeedback {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.15; // Subtle by default

    constructor() {
        // Lazy initialization - only create context when first sound is played
        if (typeof window !== 'undefined') {
            this.enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
    }

    private getContext(): AudioContext {
        if (!this.audioContext) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
        }
        return this.audioContext;
    }

    /**
     * Play a mechanical click sound - like a hardware button or relay
     * Frequency: 800Hz -> 400Hz (falling)
     * Duration: 50ms
     */
    click() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Sharp attack, quick decay
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(this.volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Play a subtle hover sound - like mechanical detent
     * Frequency: 600Hz
     * Duration: 30ms
     */
    hover() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.03);
    }

    /**
     * Play a warm success tone - like analog meter reaching optimal level
     * Frequency: 440Hz -> 880Hz (rising fifth)
     * Duration: 120ms
     */
    success() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Musical interval (perfect fifth)
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Play a sharp error tone - like digital overload warning
     * Frequency: 1200Hz -> 800Hz (falling)
     * Duration: 100ms
     */
    error() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Play a toggle switch sound - mechanical state change
     * Two quick pulses
     */
    toggle() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        const now = ctx.currentTime;

        // First pulse
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.frequency.setValueAtTime(700, now);
        gain1.gain.setValueAtTime(this.volume * 0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc1.type = 'square';
        osc1.start(now);
        osc1.stop(now + 0.04);

        // Second pulse (slightly higher pitch)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.frequency.setValueAtTime(900, now + 0.06);
        gain2.gain.setValueAtTime(this.volume * 0.5, now + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc2.type = 'square';
        osc2.start(now + 0.06);
        osc2.stop(now + 0.1);
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(level: number) {
        this.volume = Math.max(0, Math.min(1, level));
    }

    /**
     * Enable/disable all sounds
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * Clean up audio context
     */
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// Export singleton instance
export const audioFeedback = new AudioFeedback();

// Export type for convenience
export type AudioFeedbackType = typeof audioFeedback;
