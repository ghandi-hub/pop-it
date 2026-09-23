import { getLevelConfig } from './difficulty';
import { calculateBubblePopScore, calculateLevelClearScore, COMBO_TIMEOUT_MS } from './score';
import { playSound } from './sound';
import type { Bubble, GameSnapshot, GameState } from './types';

const BEST_SCORE_STORAGE_KEY = 'pop-it-time-attack:best-score';
const BEST_LEVEL_STORAGE_KEY = 'pop-it-time-attack:best-level';

export type GameListener = (snapshot: GameSnapshot) => void;

export class PopItGame {
	private state: GameState = 'idle';
	private level = 1;
	private bubbles: Bubble[] = [];
	private activeCount = 4;
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

	// Persistence
	private bestScore = 0;
	private bestLevel = 1;

	// Subscriptions
	private listeners = new Set<GameListener>();
	private nextLevelTimer: ReturnType<typeof setTimeout> | null = null;

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
			bubbles: [...this.bubbles],
			totalBubbles: this.bubbles.length,
			activeCount: this.activeCount,
			pressedCount: this.pressedCount,
			remainingTime: Math.max(0, Math.round(this.remainingTime * 100) / 100),
			baseTime: this.baseTime,
			score: this.score,
			combo: this.combo,
			maxCombo: this.maxCombo,
			bestScore: this.bestScore,
			bestLevel: this.bestLevel,
			timeBonusAwarded: this.timeBonusAwarded,
			isNewBest: this.isNewBest
		};
	}

	/**
	 * Start or Restart a new game session at Level 1
	 */
	public start(): void {
		this.cleanupTimers();

		this.level = 1;
		this.score = 0;
		this.combo = 0;
		this.maxCombo = 0;
		this.bubblesPoppedTotal = 0;
		this.lastPopTimestamp = 0;
		this.isNewBest = false;
		this.timeBonusAwarded = 0;

		const config = getLevelConfig(this.level);
		this.baseTime = config.baseTime;
		this.remainingTime = config.baseTime;
		this.initBubbles(config.totalBubbles, config.activeCount);

		this.state = 'playing';
		playSound('button-press');

		this.startTimer(this.remainingTime);
		this.notify();
	}

	public restart(): void {
		this.start();
	}

	/**
	 * Randomly select active (lit-up) bubbles for this level
	 */
	private initBubbles(totalCount: number, activeCount: number): void {
		this.activeCount = Math.min(totalCount, Math.max(1, activeCount));
		this.pressedCount = 0;

		// Generate random subset of active indices using Fisher-Yates shuffle
		const indices = Array.from({ length: totalCount }, (_, i) => i);
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = indices[i];
			indices[i] = indices[j];
			indices[j] = temp;
		}

		const activeSet = new Set(indices.slice(0, this.activeCount));

		this.bubbles = Array.from({ length: totalCount }, (_, id) => ({
			id,
			active: activeSet.has(id),
			pressed: false,
			colorIndex: id % 5
		}));
	}

	/**
	 * Handle pointer down on a bubble
	 */
	public popBubble(id: number): boolean {
		if (this.state !== 'playing') return false;

		const bubble = this.bubbles[id];
		// Only active (lit-up) and unpressed bubbles can be popped!
		if (!bubble || !bubble.active || bubble.pressed) return false;

		// 1. Mark as pressed
		bubble.pressed = true;
		this.pressedCount++;
		this.bubblesPoppedTotal++;

		// 2. Combo logic
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

		// 3. Score logic
		const popResult = calculateBubblePopScore(this.combo - 1);
		this.score += popResult.pointsAwarded;

		// If combo awarded bonus seconds
		if (popResult.comboTimeBonus > 0) {
			this.timerDurationMs += popResult.comboTimeBonus * 1000;
			playSound('time-bonus');
		} else {
			playSound('bubble-pop');
		}

		// 4. Check for level completion (all active bubbles popped)
		if (this.pressedCount >= this.activeCount) {
			this.handleLevelClear();
		} else {
			this.notify();
		}

		return true;
	}

	private handleLevelClear(): void {
		this.cleanupTimers();

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

			// Urgent sound cues when reaching thresholds
			if (this.remainingTime <= 1.5 && this.lastWarningThreshold > 1.5) {
				this.lastWarningThreshold = 1.5;
				playSound('timer-critical');
			} else if (this.remainingTime <= 3.0 && this.lastWarningThreshold > 3.0) {
				this.lastWarningThreshold = 3.0;
				playSound('timer-warning');
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
	}

	public destroy(): void {
		this.cleanupTimers();
		this.listeners.clear();
	}
}
