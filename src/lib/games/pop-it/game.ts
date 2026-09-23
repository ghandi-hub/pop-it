import { getLevelConfig } from './difficulty';
import { calculateBubblePopScore, calculateLevelClearScore, COMBO_TIMEOUT_MS } from './score';
import { playSound, sound } from './sound';
import type { Bubble, GameFeedbackEvent, GameSnapshot, GameState } from './types';

const BEST_SCORE_STORAGE_KEY = 'pop-it-time-attack:best-score';
const BEST_LEVEL_STORAGE_KEY = 'pop-it-time-attack:best-level';

export type GameListener = (snapshot: GameSnapshot) => void;

export class PopItGame {
	private state: GameState = 'idle';
	private level = 1;
	private bubbles: Bubble[] = [];
	private activeCount = 4;
	private hazardCount = 0;
	private pressedCount = 0;

	// High precision timestamp timer
	private remainingTime = 10.0;
	private baseTime = 10.0;
	private timerStartTime = 0;
	private timerDurationMs = 0;
	private rafId: number | null = null;
	private lastWarningThreshold = 100;

	// Score & combo
	private score = 0;
	private combo = 0;
	private maxCombo = 0;
	private lastPopTimestamp = 0;
	private bubblesPoppedTotal = 0;
	private timeBonusAwarded = 0;
	private isNewBest = false;
	private lastFeedback: GameFeedbackEvent | null = null;

	// Golden bubble 2-second lifespan
	private goldenTimerDurationMs = 2000;
	private goldenStartTime = 0;
	private goldenBubbleId: number | null = null;
	private lastGoldenLevel = 0;

	// Persistence
	private bestScore = 0;
	private bestLevel = 1;

	// Subscriptions
	private listeners = new Set<GameListener>();
	private nextLevelTimer: ReturnType<typeof setTimeout> | null = null;

	// Countdown sequence (3... 2... 1... GO!)
	private countdown = 3;
	private countdownTimers: ReturnType<typeof setTimeout>[] = [];

	constructor() {
		this.loadStoredBest();
	}

	private loadStoredBest(): void {
		if (typeof window === 'undefined') return;
		try {
			const savedScore = localStorage.getItem(BEST_SCORE_STORAGE_KEY);
			const savedLevel = localStorage.getItem(BEST_LEVEL_STORAGE_KEY);
			if (savedScore) this.bestScore = parseInt(savedScore, 10) || 0;
			if (savedLevel) this.bestLevel = parseInt(savedLevel, 10) || 1;
		} catch {
			// LocalStorage unavailable
		}
	}

	private saveStoredBest(): void {
		if (typeof window === 'undefined') return;
		try {
			if (this.score > this.bestScore) {
				this.bestScore = this.score;
				localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(this.bestScore));
				this.isNewBest = true;
			}
			if (this.level > this.bestLevel) {
				this.bestLevel = this.level;
				localStorage.setItem(BEST_LEVEL_STORAGE_KEY, String(this.bestLevel));
			}
		} catch {
			// LocalStorage unavailable
		}
	}

	public subscribe(listener: GameListener): () => void {
		this.listeners.add(listener);
		listener(this.getSnapshot());
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notify(): void {
		const snapshot = this.getSnapshot();
		for (const listener of this.listeners) {
			listener(snapshot);
		}
	}

	public getSnapshot(): GameSnapshot {
		return {
			state: this.state,
			level: this.level,
			countdown: this.countdown,
			bubbles: this.bubbles.map((b) => ({ ...b })),
			totalBubbles: this.bubbles.length,
			activeCount: this.activeCount,
			hazardCount: this.hazardCount,
			pressedCount: this.pressedCount,
			remainingTime: Math.max(0, Math.round(this.remainingTime * 100) / 100),
			baseTime: this.baseTime,
			score: this.score,
			combo: this.combo,
			maxCombo: this.maxCombo,
			bestScore: this.bestScore,
			bestLevel: this.bestLevel,
			timeBonusAwarded: this.timeBonusAwarded,
			isNewBest: this.isNewBest,
			lastFeedback: this.lastFeedback
		};
	}

	/**
	 * Start or Restart a new game session at Level 1 with countdown
	 */
	public start(): void {
		this.cleanupTimers();
		sound.stopGameOverSound();
		sound.stopLevelWinSound();
		sound.stopBgm();

		this.level = 1;
		this.score = 0;
		this.combo = 0;
		this.maxCombo = 0;
		this.bubblesPoppedTotal = 0;
		this.lastPopTimestamp = 0;
		this.isNewBest = false;
		this.timeBonusAwarded = 0;
		this.hazardCount = 0;
		this.lastFeedback = null;
		this.lastGoldenLevel = 0;

		const config = getLevelConfig(this.level);
		this.baseTime = config.baseTime;
		this.remainingTime = config.baseTime;
		this.initBubbles(config.totalBubbles, config.activeCount);

		this.state = 'countdown';
		this.countdown = 3;
		playSound('countdown');
		this.notify();

		// Sequence timing matching count-down.mp3
		// 0ms: 3 -> 1000ms: 2 -> 2000ms: 1 -> 3000ms: 0 (POP IT!) -> 3500ms: playing
		const timer2 = setTimeout(() => {
			if (this.state !== 'countdown') return;
			this.countdown = 2;
			this.notify();
		}, 1000);

		const timer1 = setTimeout(() => {
			if (this.state !== 'countdown') return;
			this.countdown = 1;
			this.notify();
		}, 2000);

		const timerGo = setTimeout(() => {
			if (this.state !== 'countdown') return;
			this.countdown = 0;
			this.notify();
		}, 3000);

		const timerPlay = setTimeout(() => {
			if (this.state !== 'countdown') return;
			this.state = 'playing';
			sound.startBgm();
			this.startTimer(this.remainingTime);
			this.notify();
		}, 3500);

		this.countdownTimers.push(timer2, timer1, timerGo, timerPlay);
	}

	public restart(): void {
		this.start();
	}

	/**
	 * Randomly select active (lit-up) bubbles, golden bonus, and hazard bubbles
	 */
	private initBubbles(totalCount: number, activeCount: number): void {
		this.activeCount = Math.min(totalCount, Math.max(1, activeCount));
		this.pressedCount = 0;
		this.lastFeedback = null;

		// Generate random permutation of indices using Fisher-Yates shuffle
		const indices = Array.from({ length: totalCount }, (_, i) => i);
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = indices[i];
			indices[i] = indices[j];
			indices[j] = temp;
		}

		// Valid targets (player must pop these to clear stage)
		const targetIndices = indices.slice(0, this.activeCount);
		const targetSet = new Set(targetIndices);

		// Remaining inactive slots where hazards can spawn
		const remainingIndices = indices.slice(this.activeCount);

		// 1. Golden Bubble:
		// Early levels (Level 1-2): NO golden bubble.
		// Level >= 3: At most 1 golden bubble, does not appear every level (never consecutive levels).
		let goldenIndex: number | null = null;
		if (this.level >= 3 && targetIndices.length > 0) {
			const levelsSinceLast = this.level - this.lastGoldenLevel;
			// Ensure at least 1 level break between golden appearances (never consecutive)
			if (levelsSinceLast >= 2) {
				const shouldSpawn = levelsSinceLast >= 4 || Math.random() < 0.4;
				if (shouldSpawn) {
					const slot = Math.floor(Math.random() * targetIndices.length);
					goldenIndex = targetIndices[slot];
					this.lastGoldenLevel = this.level;
				}
			}
		}
		this.goldenBubbleId = goldenIndex;

		// 2. Hazard Bubbles:
		// Early levels (Level 1-2): NO hazard bubbles.
		// As levels increase, hazards scale up gradually:
		// - Level 3-4: 1 hazard
		// - Level 5-7: 2 hazards
		// - Level 8+: 3 hazards (capped to leave space for neutral bubbles)
		const hazardSet = new Set<number>();
		if (this.level >= 3 && remainingIndices.length > 0) {
			let desiredHazards = 1;
			if (this.level >= 8) {
				desiredHazards = 3;
			} else if (this.level >= 5) {
				desiredHazards = 2;
			}

			// Ensure hazards do not take over all remaining inactive slots
			const maxAllowed = Math.max(1, remainingIndices.length - 1);
			const count = Math.min(desiredHazards, maxAllowed, remainingIndices.length);

			for (let i = 0; i < count; i++) {
				hazardSet.add(remainingIndices[i]);
			}
		}
		this.hazardCount = hazardSet.size;

		this.bubbles = Array.from({ length: totalCount }, (_, id) => {
			if (hazardSet.has(id)) {
				return {
					id,
					active: true,
					pressed: false,
					type: 'hazard' as const,
					colorIndex: 0
				};
			}

			if (id === goldenIndex) {
				return {
					id,
					active: true,
					pressed: false,
					type: 'golden' as const,
					colorIndex: 1,
					goldenTimeLeft: 2.0,
					isExpiring: false
				};
			}

			const isTarget = targetSet.has(id);
			return {
				id,
				active: isTarget,
				pressed: false,
				type: 'normal' as const,
				colorIndex: id % 5
			};
		});
	}

	/**
	 * Handle pointer down on a bubble
	 */
	public popBubble(id: number): boolean {
		if (this.state !== 'playing') return false;

		const bubble = this.bubbles[id];
		// Only active and unpressed bubbles can be popped
		if (!bubble || !bubble.active || bubble.pressed) return false;

		// 1. HAZARD BUBBLE POPPED (PENALTY!)
		if (bubble.type === 'hazard') {
			bubble.pressed = true;
			this.combo = 0;
			this.lastPopTimestamp = 0;

			// Deduct 3 seconds
			const penaltyMs = 3000;
			const now = performance.now();
			const elapsedMs = now - this.timerStartTime;
			const currentRemainingMs = this.timerDurationMs - elapsedMs;

			this.timerDurationMs = Math.max(0, this.timerDurationMs - penaltyMs);

			// Haptic feedback
			if (typeof navigator !== 'undefined' && navigator.vibrate) {
				navigator.vibrate([100, 50, 100]);
			}

			playSound('hazard-pop');

			this.lastFeedback = {
				type: 'hazard',
				message: '⚠️ HAZARD! -3.0s & Combo Reset!',
				timestamp: Date.now()
			};

			// Check if penalty caused immediate time-out
			if (currentRemainingMs <= penaltyMs) {
				this.remainingTime = 0;
				this.handleGameOver();
				return true;
			}

			this.notify();
			return true;
		}

		// 2. GOLDEN BUBBLE POPPED (BONUS REWARD!)
		if (bubble.type === 'golden') {
			bubble.pressed = true;
			this.goldenBubbleId = null;
			bubble.goldenTimeLeft = 0;
			bubble.isExpiring = false;
			this.pressedCount++;
			this.bubblesPoppedTotal++;

			// Combo logic
			const now = performance.now();
			if (this.lastPopTimestamp > 0 && now - this.lastPopTimestamp <= COMBO_TIMEOUT_MS) {
				this.combo++;
			} else {
				this.combo = 1;
			}
			this.lastPopTimestamp = now;
			if (this.combo > this.maxCombo) {
				this.maxCombo = this.combo;
			}

			// Add 2.0 bonus seconds and 100 extra points
			this.timerDurationMs += 2000;
			const popResult = calculateBubblePopScore(this.combo - 1);
			this.score += popResult.pointsAwarded + 100;

			// Haptic feedback
			if (typeof navigator !== 'undefined' && navigator.vibrate) {
				navigator.vibrate([20, 30, 40]);
			}

			playSound('golden-pop');

			this.lastFeedback = {
				type: 'golden',
				message: '✨ GOLDEN POP! +2.0s & +100 PTS!',
				timestamp: Date.now()
			};

			if (this.pressedCount >= this.activeCount) {
				this.handleLevelClear();
			} else {
				this.notify();
			}

			return true;
		}

		// 3. NORMAL BUBBLE POPPED
		bubble.pressed = true;
		this.pressedCount++;
		this.bubblesPoppedTotal++;

		// Haptic vibration
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate(15);
		}

		// Combo logic
		const now = performance.now();
		if (this.lastPopTimestamp > 0 && now - this.lastPopTimestamp <= COMBO_TIMEOUT_MS) {
			this.combo++;
		} else {
			this.combo = 1;
		}
		this.lastPopTimestamp = now;
		if (this.combo > this.maxCombo) {
			this.maxCombo = this.combo;
		}

		// Score logic
		const popResult = calculateBubblePopScore(this.combo - 1);
		this.score += popResult.pointsAwarded;

		// If combo awarded bonus seconds
		if (popResult.comboTimeBonus > 0) {
			this.timerDurationMs += popResult.comboTimeBonus * 1000;
			playSound('time-bonus');
		} else {
			playSound('bubble-pop');
		}

		// Check for level completion
		if (this.pressedCount >= this.activeCount) {
			this.handleLevelClear();
		} else {
			this.notify();
		}

		return true;
	}

	private handleLevelClear(): void {
		this.cleanupTimers();
		this.goldenBubbleId = null;

		// Calculate remaining time before state change
		const currentRemaining = Math.max(0, this.remainingTime);
		const config = getLevelConfig(this.level);

		// Award bonus score
		const levelClearBonus = calculateLevelClearScore(this.level, currentRemaining);
		this.score += levelClearBonus;
		this.timeBonusAwarded = config.bonusTime;

		this.state = 'level-clear';
		playSound('level-clear');
		this.notify();

		// Carry-over time to next level (PRD 13 / Tech Spec 13)
		// nextTime = remainingTime + bonusTime
		const nextTime = Math.round((currentRemaining + config.bonusTime) * 100) / 100;

		// Celebration delay (~750ms) before initiating next level
		this.nextLevelTimer = setTimeout(() => {
			this.advanceToNextLevel(nextTime);
		}, 750);
	}

	/**
	 * Advances endlessly to the next level (Level 2, 3 ... 20, 50, 100+)
	 */
	private advanceToNextLevel(carriedTime: number): void {
		sound.stopLevelWinSound();
		this.level++;
		const nextConfig = getLevelConfig(this.level);

		const startingTime = Math.max(carriedTime, Math.min(nextConfig.baseTime, 6.0));
		this.baseTime = startingTime;
		this.remainingTime = startingTime;
		this.initBubbles(nextConfig.totalBubbles, nextConfig.activeCount);

		this.state = 'playing';
		playSound('time-bonus');
		this.startTimer(this.remainingTime);
		this.notify();
	}

	private handleGameOver(): void {
		this.cleanupTimers();
		this.goldenBubbleId = null;
		sound.stopBgm();
		this.state = 'game-over';
		this.remainingTime = 0;
		playSound('game-over');
		this.saveStoredBest();
		this.notify();
	}

	/**
	 * Timestamp-based timer loop using requestAnimationFrame
	 */
	private startTimer(durationSeconds: number): void {
		this.cleanupTimers();
		this.timerStartTime = performance.now();
		this.goldenStartTime = performance.now();
		this.timerDurationMs = durationSeconds * 1000;
		this.lastWarningThreshold = 100;

		const tick = (now: number) => {
			if (this.state !== 'playing') return;

			const elapsedMs = now - this.timerStartTime;
			const remainingMs = this.timerDurationMs - elapsedMs;

			if (remainingMs <= 0) {
				this.handleGameOver();
				return;
			}

			this.remainingTime = remainingMs / 1000;

			// Urgent sound cue when entering "HURRY UP!" (<= 3.0s)
			if (this.remainingTime <= 3.0 && this.lastWarningThreshold > 3.0) {
				this.lastWarningThreshold = 3.0;
				playSound('hurry-up');
			} else if (this.remainingTime > 3.0 && this.lastWarningThreshold <= 3.0) {
				// Player recovered time above 3s via combo/golden bonus!
				this.lastWarningThreshold = 100;
				sound.stopTimeSound();
			}

			// Golden bubble 2-second lifespan countdown
			if (this.goldenBubbleId !== null) {
				const goldenBubble = this.bubbles[this.goldenBubbleId];
				if (goldenBubble && goldenBubble.active && !goldenBubble.pressed && goldenBubble.type === 'golden') {
					const goldenElapsed = now - this.goldenStartTime;
					const goldenRemainingMs = this.goldenTimerDurationMs - goldenElapsed;

					if (goldenRemainingMs <= 0) {
						// Golden bubble 2.0s expired!
						// Reverts into a normal bubble (player loses golden bonus, must pop as normal bubble)
						goldenBubble.type = 'normal';
						goldenBubble.goldenTimeLeft = 0;
						goldenBubble.isExpiring = false;
						this.goldenBubbleId = null;

						this.lastFeedback = {
							type: 'golden',
							message: '💨 GOLDEN EXPIRED! (Turned Normal)',
							timestamp: Date.now()
						};
					} else {
						const secondsLeft = Math.max(0.1, Math.round((goldenRemainingMs / 1000) * 10) / 10);
						goldenBubble.goldenTimeLeft = secondsLeft;
						goldenBubble.isExpiring = secondsLeft <= 0.8;
					}
				} else {
					this.goldenBubbleId = null;
				}
			}

			this.notify();
			this.rafId = requestAnimationFrame(tick);
		};

		this.rafId = requestAnimationFrame(tick);
	}

	private cleanupTimers(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		if (this.nextLevelTimer !== null) {
			clearTimeout(this.nextLevelTimer);
			this.nextLevelTimer = null;
		}
		for (const timer of this.countdownTimers) {
			clearTimeout(timer);
		}
		this.countdownTimers = [];
		sound.stopCountDownSound();
		sound.stopTimeSound();
	}

	public destroy(): void {
		this.cleanupTimers();
		sound.stopBgm();
		this.listeners.clear();
	}
}
