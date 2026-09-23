import popSoundUrl from '$lib/assets/sound/pop.mp3';
import levelWinSoundUrl from '$lib/assets/sound/level-win.mp3';
import gameOverSoundUrl from '$lib/assets/sound/game-over.mp3';
import backsoundUrl from '$lib/assets/sound/backsound.mp3';

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
	private volume = 0.85;
	private masterGain: GainNode | null = null;

	// Audio buffers
	private popBuffer: AudioBuffer | null = null;
	private levelWinBuffer: AudioBuffer | null = null;
	private gameOverBuffer: AudioBuffer | null = null;

	// Immediate HTMLAudioElement fallback pool for pop.mp3
	private popPool: HTMLAudioElement[] = [];
	private popPoolIndex = 0;

	// Fallback audio elements for longer sounds
	private levelWinAudio: HTMLAudioElement | null = null;
	private gameOverAudio: HTMLAudioElement | null = null;

	// Background Music (backsound.mp3)
	private bgmAudio: HTMLAudioElement | null = null;
	private isBgmPlaying = false;

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

			this.preloadAudioAssets();
		}
	}

	/**
	 * Preload all downloaded sound assets on module startup
	 */
	private preloadAudioAssets(): void {
		if (typeof window === 'undefined') return;

		try {
			// 1. Preload pop.mp3 pool for instant tapping
			for (let i = 0; i < 6; i++) {
				const a = new Audio(popSoundUrl);
				a.preload = 'auto';
				a.volume = this.volume;
				this.popPool.push(a);
			}

			// 2. Preload level-win.mp3
			this.levelWinAudio = new Audio(levelWinSoundUrl);
			this.levelWinAudio.preload = 'auto';
			this.levelWinAudio.volume = 0.9;

			// 3. Preload game-over.mp3
			this.gameOverAudio = new Audio(gameOverSoundUrl);
			this.gameOverAudio.preload = 'auto';
			this.gameOverAudio.volume = 0.9;

			// 4. Preload backsound.mp3 (Looping background music)
			this.bgmAudio = new Audio(backsoundUrl);
			this.bgmAudio.preload = 'auto';
			this.bgmAudio.loop = true;
			this.bgmAudio.volume = 0.35; // balanced background level
		} catch (err) {
			console.warn('Audio preloading error:', err);
		}
	}

	public init(): void {
		if (typeof window === 'undefined') return;

		try {
			if (!this.ctx) {
				const AudioContextClass =
					window.AudioContext ||
					(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

				if (AudioContextClass) {
					this.ctx = new AudioContextClass();
					this.masterGain = this.ctx.createGain();
					this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
					this.masterGain.connect(this.ctx.destination);
				}
			}

			// Fetch and decode into Web Audio buffers for polyphony & instant playback
			if (this.ctx) {
				if (!this.popBuffer) this.loadBuffer(popSoundUrl, (buf) => (this.popBuffer = buf));
				if (!this.levelWinBuffer) this.loadBuffer(levelWinSoundUrl, (buf) => (this.levelWinBuffer = buf));
				if (!this.gameOverBuffer) this.loadBuffer(gameOverSoundUrl, (buf) => (this.gameOverBuffer = buf));
			}
		} catch {
			// Web Audio not supported
		}
	}

	private loadBuffer(url: string, callback: (buf: AudioBuffer) => void): void {
		if (!this.ctx) return;
		fetch(url)
			.then((res) => res.arrayBuffer())
			.then((ab) => this.ctx?.decodeAudioData(ab))
			.then((decoded) => {
				if (decoded) callback(decoded);
			})
			.catch(() => {});
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

		if (this.bgmAudio) {
			if (!this.enabled) {
				this.bgmAudio.pause();
			} else if (this.isBgmPlaying) {
				this.bgmAudio.play().catch(() => {});
			}
		}

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
		if (this.bgmAudio) {
			this.bgmAudio.volume = this.volume * 0.4;
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

	/**
	 * Start playing backsound.mp3 looping in background
	 */
	public startBgm(): void {
		this.isBgmPlaying = true;
		if (!this.enabled || !this.bgmAudio) return;

		try {
			this.bgmAudio.currentTime = 0;
			this.bgmAudio.play().catch(() => {});
		} catch {
			// Autoplay blocked until gesture
		}
	}

	/**
	 * Pause or stop backsound.mp3
	 */
	public stopBgm(): void {
		this.isBgmPlaying = false;
		if (this.bgmAudio) {
			this.bgmAudio.pause();
		}
	}

	public play(event: SoundEvent): void {
		if (!this.enabled) return;

		this.resume();

		try {
			const now = this.ctx ? this.ctx.currentTime : 0;
			switch (event) {
				case 'bubble-pop':
				case 'button-press':
					this.playPopSound(now);
					break;
				case 'level-clear':
					this.playLevelWinSound(now);
					break;
				case 'game-over':
					this.playGameOverSound(now);
					break;
				case 'time-bonus':
					this.playTimeBonus(now);
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
	 * Play pop.mp3 with organic pitch jitter
	 */
	private playPopSound(now: number): void {
		if (this.popBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.popBuffer;

				const pitchJitter = 1 + (Math.random() * 0.08 - 0.04);
				source.playbackRate.setValueAtTime(pitchJitter, now);

				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);

				source.connect(gain);
				gain.connect(this.masterGain);
				source.start(now);
				return;
			} catch {
				// Fallback
			}
		}

		if (this.popPool.length > 0) {
			try {
				const audio = this.popPool[this.popPoolIndex];
				this.popPoolIndex = (this.popPoolIndex + 1) % this.popPool.length;
				audio.currentTime = 0;
				audio.play().catch(() => {});
			} catch {}
		}
	}

	/**
	 * Play level-win.mp3 on level completion
	 */
	private playLevelWinSound(now: number): void {
		// Duck BGM momentarily during victory sound
		if (this.bgmAudio && this.isBgmPlaying) {
			this.bgmAudio.volume = 0.15;
			setTimeout(() => {
				if (this.bgmAudio && this.isBgmPlaying && this.enabled) {
					this.bgmAudio.volume = 0.35;
				}
			}, 1200);
		}

		if (this.levelWinBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.levelWinBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);
				source.start(now);
				return;
			} catch {}
		}

		if (this.levelWinAudio) {
			this.levelWinAudio.currentTime = 0;
			this.levelWinAudio.play().catch(() => {});
		}
	}

	/**
	 * Play game-over.mp3 when timer reaches zero
	 */
	private playGameOverSound(now: number): void {
		// Stop BGM completely on game over
		this.stopBgm();

		if (this.gameOverBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.gameOverBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);
				source.start(now);
				return;
			} catch {}
		}

		if (this.gameOverAudio) {
			this.gameOverAudio.currentTime = 0;
			this.gameOverAudio.play().catch(() => {});
		}
	}

	private playTimeBonus(now: number): void {
		if (!this.ctx || !this.masterGain) return;

		const notes = [659.25, 987.77];
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
