import popSoundUrl from '$lib/assets/sound/pop.mp3';
import levelWinSoundUrl from '$lib/assets/sound/level-win.mp3';
import gameOverSoundUrl from '$lib/assets/sound/game-over.mp3';
import backsoundUrl from '$lib/assets/sound/backsound.mp3';
import hazardSoundUrl from '$lib/assets/sound/hazard-bubble.mp3';
import goldenSoundUrl from '$lib/assets/sound/golden-bubble.mp3';
import countDownSoundUrl from '$lib/assets/sound/count-down.mp3';
import timeSoundUrl from '$lib/assets/sound/time.mp3';

export type SoundEvent =
	| 'bubble-pop'
	| 'button-press'
	| 'level-clear'
	| 'time-bonus'
	| 'game-over'
	| 'timer-warning'
	| 'timer-critical'
	| 'hazard-pop'
	| 'golden-pop'
	| 'countdown'
	| 'hurry-up';

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
	private hazardBuffer: AudioBuffer | null = null;
	private goldenBuffer: AudioBuffer | null = null;
	private countDownBuffer: AudioBuffer | null = null;
	private timeBuffer: AudioBuffer | null = null;

	// Active sources for stoppable audio
	private gameOverSource: AudioBufferSourceNode | null = null;
	private levelWinSource: AudioBufferSourceNode | null = null;
	private countDownSource: AudioBufferSourceNode | null = null;
	private timeSource: AudioBufferSourceNode | null = null;

	// Immediate HTMLAudioElement fallback pool for pop.mp3
	private popPool: HTMLAudioElement[] = [];
	private popPoolIndex = 0;

	// Fallback audio elements for longer sounds
	private levelWinAudio: HTMLAudioElement | null = null;
	private gameOverAudio: HTMLAudioElement | null = null;
	private hazardAudio: HTMLAudioElement | null = null;
	private goldenAudio: HTMLAudioElement | null = null;
	private countDownAudio: HTMLAudioElement | null = null;
	private timeAudio: HTMLAudioElement | null = null;
	private isTimePlaying = false;

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

			// 5. Preload hazard-bubble.mp3
			this.hazardAudio = new Audio(hazardSoundUrl);
			this.hazardAudio.preload = 'auto';
			this.hazardAudio.volume = 0.95;

			// 6. Preload golden-bubble.mp3
			this.goldenAudio = new Audio(goldenSoundUrl);
			this.goldenAudio.preload = 'auto';
			this.goldenAudio.volume = 0.95;

			// 7. Preload count-down.mp3
			this.countDownAudio = new Audio(countDownSoundUrl);
			this.countDownAudio.preload = 'auto';
			this.countDownAudio.volume = 0.95;

			// 8. Preload time.mp3 (Hurry-up countdown sound)
			this.timeAudio = new Audio(timeSoundUrl);
			this.timeAudio.preload = 'auto';
			this.timeAudio.volume = 0.95;
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
				if (!this.hazardBuffer) this.loadBuffer(hazardSoundUrl, (buf) => (this.hazardBuffer = buf));
				if (!this.goldenBuffer) this.loadBuffer(goldenSoundUrl, (buf) => (this.goldenBuffer = buf));
				if (!this.countDownBuffer) this.loadBuffer(countDownSoundUrl, (buf) => (this.countDownBuffer = buf));
				if (!this.timeBuffer) this.loadBuffer(timeSoundUrl, (buf) => (this.timeBuffer = buf));
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
		} else {
			this.stopGameOverSound();
			this.stopLevelWinSound();
			this.stopCountDownSound();
			this.stopTimeSound();
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

	/**
	 * Instantly stop game-over sound when player restarts / tries again
	 */
	public stopGameOverSound(): void {
		this.stopTimeSound();
		if (this.gameOverSource) {
			try {
				this.gameOverSource.stop();
				this.gameOverSource.disconnect();
			} catch {}
			this.gameOverSource = null;
		}
		if (this.gameOverAudio) {
			try {
				this.gameOverAudio.pause();
				this.gameOverAudio.currentTime = 0;
			} catch {}
		}
	}

	/**
	 * Instantly stop level-win sound when advancing to next stage
	 */
	public stopLevelWinSound(): void {
		this.stopTimeSound();
		if (this.levelWinSource) {
			try {
				this.levelWinSource.stop();
				this.levelWinSource.disconnect();
			} catch {}
			this.levelWinSource = null;
		}
		if (this.levelWinAudio) {
			try {
				this.levelWinAudio.pause();
				this.levelWinAudio.currentTime = 0;
			} catch {}
		}
	}

	/**
	 * Instantly stop count-down sound
	 */
	public stopCountDownSound(): void {
		if (this.countDownSource) {
			try {
				this.countDownSource.stop();
				this.countDownSource.disconnect();
			} catch {}
			this.countDownSource = null;
		}
		if (this.countDownAudio) {
			try {
				this.countDownAudio.pause();
				this.countDownAudio.currentTime = 0;
			} catch {}
		}
	}

	/**
	 * Instantly stop hurry-up time sound and restore BGM volume
	 */
	public stopTimeSound(): void {
		this.isTimePlaying = false;
		if (this.timeSource) {
			try {
				this.timeSource.stop();
				this.timeSource.disconnect();
			} catch {}
			this.timeSource = null;
		}
		if (this.timeAudio) {
			try {
				this.timeAudio.pause();
				this.timeAudio.currentTime = 0;
			} catch {}
		}
		if (this.bgmAudio && this.isBgmPlaying && this.enabled) {
			this.bgmAudio.volume = 0.35;
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
				case 'hazard-pop':
					this.playHazardSound(now);
					break;
				case 'golden-pop':
					this.playGoldenSound(now);
					break;
				case 'countdown':
					this.playCountDownSound(now);
					break;
				case 'hurry-up':
					this.playHurryUpSound(now);
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
		this.stopLevelWinSound();

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

				this.levelWinSource = source;
				source.onended = () => {
					if (this.levelWinSource === source) {
						this.levelWinSource = null;
					}
				};

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
		this.stopGameOverSound();

		if (this.gameOverBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.gameOverBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);

				this.gameOverSource = source;
				source.onended = () => {
					if (this.gameOverSource === source) {
						this.gameOverSource = null;
					}
				};

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

	private playHazardSound(now: number): void {
		if (this.hazardBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.hazardBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);
				source.start(now);
				return;
			} catch {}
		}

		if (this.hazardAudio) {
			try {
				this.hazardAudio.currentTime = 0;
				this.hazardAudio.play().catch(() => {});
				return;
			} catch {}
		}

		// Fallback synthesizer if file not loaded
		if (!this.ctx || !this.masterGain) return;
		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(260, now);
			osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);
			gain.gain.setValueAtTime(0.45, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
			osc.connect(gain);
			gain.connect(this.masterGain);
			osc.start(now);
			osc.stop(now + 0.32);
		} catch {}
	}

	private playGoldenSound(now: number): void {
		if (this.goldenBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.goldenBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);
				source.start(now);
				return;
			} catch {}
		}

		if (this.goldenAudio) {
			try {
				this.goldenAudio.currentTime = 0;
				this.goldenAudio.play().catch(() => {});
				return;
			} catch {}
		}

		// Fallback synthesizer if file not loaded
		if (!this.ctx || !this.masterGain) return;
		try {
			const notes = [1046.5, 1318.5, 1567.98, 2093.0];
			notes.forEach((freq, idx) => {
				if (!this.ctx || !this.masterGain) return;
				const noteTime = now + idx * 0.05;
				const osc = this.ctx.createOscillator();
				const gain = this.ctx.createGain();
				osc.type = 'triangle';
				osc.frequency.setValueAtTime(freq, noteTime);
				gain.gain.setValueAtTime(0.4, noteTime);
				gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);
				osc.connect(gain);
				gain.connect(this.masterGain);
				osc.start(noteTime);
				osc.stop(noteTime + 0.25);
			});
		} catch {}
	}

	/**
	 * Play count-down.mp3 during the 3-2-1 countdown sequence
	 */
	private playCountDownSound(now: number): void {
		this.stopCountDownSound();
		this.stopBgm();

		if (this.countDownBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.countDownBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);

				this.countDownSource = source;
				source.onended = () => {
					if (this.countDownSource === source) {
						this.countDownSource = null;
					}
				};

				source.start(now);
				return;
			} catch {}
		}

		if (this.countDownAudio) {
			try {
				this.countDownAudio.currentTime = 0;
				this.countDownAudio.play().catch(() => {});
				return;
			} catch {}
		}

		// Fallback beep sequence if audio file cannot be loaded
		if (!this.ctx || !this.masterGain) return;
		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(800, now);
			gain.gain.setValueAtTime(0.3, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
			osc.connect(gain);
			gain.connect(this.masterGain);
			osc.start(now);
			osc.stop(now + 0.16);
		} catch {}
	}

	/**
	 * Play time.mp3 when timer enters hurry-up threshold (<= 3.0s)
	 */
	private playHurryUpSound(now: number): void {
		if (this.isTimePlaying) return;
		this.isTimePlaying = true;

		// Duck BGM slightly to make the ticking / hurry-up sound punchy and audible
		if (this.bgmAudio && this.isBgmPlaying) {
			this.bgmAudio.volume = 0.15;
		}

		if (this.timeBuffer && this.ctx && this.masterGain) {
			try {
				const source = this.ctx.createBufferSource();
				source.buffer = this.timeBuffer;
				const gain = this.ctx.createGain();
				gain.gain.setValueAtTime(1.0, now);
				source.connect(gain);
				gain.connect(this.masterGain);

				this.timeSource = source;
				source.onended = () => {
					if (this.timeSource === source) {
						this.timeSource = null;
						this.isTimePlaying = false;
						if (this.bgmAudio && this.isBgmPlaying && this.enabled) {
							this.bgmAudio.volume = 0.35;
						}
					}
				};

				source.start(now);
				return;
			} catch {}
		}

		if (this.timeAudio) {
			try {
				this.timeAudio.currentTime = 0;
				this.timeAudio.onended = () => {
					this.isTimePlaying = false;
					if (this.bgmAudio && this.isBgmPlaying && this.enabled) {
						this.bgmAudio.volume = 0.35;
					}
				};
				this.timeAudio.play().catch(() => {});
			} catch {}
		}
	}
}

export const sound = new SoundManager();

export function playSound(event: SoundEvent): void {
	sound.play(event);
}
