export type SoundEvent =
	| 'bubble-pop'
	| 'button-press'
	| 'level-clear'
	| 'time-bonus'
	| 'game-over'
	| 'timer-warning'
	| 'timer-critical';

const SOUND_STORAGE_KEY = 'pop-it-time-attack:sound-enabled';

class SoundManager {
	private ctx: AudioContext | null = null;
	private enabled = true;
	private volume = 0.7;
	private masterGain: GainNode | null = null;
	private isInitialized = false;

	constructor() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem(SOUND_STORAGE_KEY);
				if (saved !== null) {
					this.enabled = saved === 'true';
				}
			} catch {
				this.enabled = true;
			}
		}
	}

	public init(): void {
		if (this.isInitialized || typeof window === 'undefined') return;

		try {
			const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (AudioContextClass) {
				this.ctx = new AudioContextClass();
				this.masterGain = this.ctx.createGain();
				this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
				this.masterGain.connect(this.ctx.destination);
				this.isInitialized = true;
			}
		} catch {
			// Web Audio not supported or blocked, continue silently
		}
	}

	public toggleSound(): boolean {
		this.enabled = !this.enabled;
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(SOUND_STORAGE_KEY, String(this.enabled));
			} catch {
				// localStorage unavailable
			}
		}

		if (this.masterGain && this.ctx) {
			this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
		}

		// Also initialize audio context if user toggles on
		if (this.enabled) {
			this.init();
			this.resume();
		}

		return this.enabled;
	}

	public isSoundEnabled(): boolean {
		return this.enabled;
	}

	public setVolume(vol: number): void {
		this.volume = Math.max(0, Math.min(1, vol));
		if (this.masterGain && this.ctx && this.enabled) {
			this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
		}
	}

	public resume(): void {
		if (!this.ctx) {
			this.init();
		}
		if (this.ctx && this.ctx.state === 'suspended') {
			this.ctx.resume().catch(() => {});
		}
	}

	public play(event: SoundEvent): void {
		if (!this.enabled) return;

		this.resume();
		if (!this.ctx || !this.masterGain) return;

		try {
			const now = this.ctx.currentTime;
			switch (event) {
				case 'bubble-pop':
					this.playBubblePop(now);
					break;
				case 'button-press':
					this.playButtonPress(now);
					break;
				case 'level-clear':
					this.playLevelClear(now);
					break;
				case 'time-bonus':
					this.playTimeBonus(now);
					break;
				case 'game-over':
					this.playGameOver(now);
					break;
				case 'timer-warning':
					this.playTimerWarning(now);
					break;
				case 'timer-critical':
					this.playTimerCritical(now);
					break;
			}
		} catch {
			// Fail gracefully
		}
	}

	/**
	 * Tactile pop sound:
	 * Rapid pitch-dropped sine + gentle rubbery click impulse (40-100ms)
	 * With ±5% random pitch variation to prevent repetition fatigue.
	 */
	private playBubblePop(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		// Subtle pitch variation: 380Hz to 460Hz
		const pitchJitter = 1 + (Math.random() * 0.12 - 0.06);
		const startFreq = 420 * pitchJitter;
		const endFreq = 110 * pitchJitter;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(startFreq, now);
		osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.07);

		// Snappy attack, quick exponential decay
		gain.gain.setValueAtTime(0.7, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

		// Subtle high-click transient for tactile feel
		const clickOsc = this.ctx.createOscillator();
		const clickGain = this.ctx.createGain();
		clickOsc.type = 'triangle';
		clickOsc.frequency.setValueAtTime(950 * pitchJitter, now);
		clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);
		clickGain.gain.setValueAtTime(0.3, now);
		clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

		osc.connect(gain);
		clickOsc.connect(clickGain);
		gain.connect(this.masterGain);
		clickGain.connect(this.masterGain);

		osc.start(now);
		osc.stop(now + 0.09);
		clickOsc.start(now);
		clickOsc.stop(now + 0.03);
	}

	/**
	 * Crisp arcade button press
	 */
	private playButtonPress(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'square';
		osc.frequency.setValueAtTime(320, now);
		osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

		gain.gain.setValueAtTime(0.3, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(now);
		osc.stop(now + 0.06);
	}

	/**
	 * Upbeat 4-note ascending arcade fanfare
	 */
	private playLevelClear(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
		const step = 0.08;

		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.masterGain) return;
			const noteTime = now + idx * step;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, noteTime);

			gain.gain.setValueAtTime(0.45, noteTime);
			gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

			osc.connect(gain);
			gain.connect(this.masterGain);

			osc.start(noteTime);
			osc.stop(noteTime + 0.25);
		});
	}

	/**
	 * Sparkly chime for time bonus
	 */
	private playTimeBonus(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const notes = [659.25, 987.77]; // E5, B5
		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.masterGain) return;
			const noteTime = now + idx * 0.06;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, noteTime);

			gain.gain.setValueAtTime(0.4, noteTime);
			gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

			osc.connect(gain);
			gain.connect(this.masterGain);

			osc.start(noteTime);
			osc.stop(noteTime + 0.2);
		});
	}

	/**
	 * Retro descending thud / game over
	 */
	private playGameOver(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(260, now);
		osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);

		gain.gain.setValueAtTime(0.4, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(now);
		osc.stop(now + 0.52);
	}

	private playTimerWarning(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(750, now);

		gain.gain.setValueAtTime(0.25, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(now);
		osc.stop(now + 0.07);
	}

	private playTimerCritical(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(980, now);

		gain.gain.setValueAtTime(0.35, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(now);
		osc.stop(now + 0.06);
	}
}

export const sound = new SoundManager();

export function playSound(event: SoundEvent): void {
	sound.play(event);
}
