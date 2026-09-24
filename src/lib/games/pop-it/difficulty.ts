import type { LevelConfig } from './types';

export const BOARD_TOTAL_BUBBLES = 20; // Standard 4x5 physical Pop It tray
export const MAX_TIMER_CAP = 8.0; // Maximum time in seconds a player can accumulate

/**
 * Endless level generator:
 * - Dynamically scales for Level 1, 2, 3 ... 50, 100+ without any upper limit.
 * - Randomly lights up a subset of bubbles (activeCount), scaling from 4 up to 18.
 * - Base time and bonus time are calculated dynamically to stay balanced and thrilling.
 */
export function getLevelConfig(level: number): LevelConfig {
	const safeLevel = Math.max(1, Math.floor(level));

	let activeCount: number;
	let baseTime: number;
	let bonusTime: number;

	if (safeLevel <= 12) {
		// Progressive ramp up: 4, 5, 6, 7, ... 15 active targets
		activeCount = Math.min(15, 3 + safeLevel);
		// Level 1: 5.0s, Level 5: 5.8s, Level 12: 7.2s
		baseTime = Math.round((4.8 + safeLevel * 0.2) * 10) / 10;
		bonusTime = safeLevel <= 5 ? 1.2 : safeLevel <= 10 ? 1.0 : 0.8;
	} else {
		// Endless high-speed tiers:
		// Active targets oscillate between 15 and 18 for variety
		const cycle = (safeLevel - 13) % 4;
		activeCount = 15 + cycle; // 15, 16, 17, 18
		
		// Gradually tighten base time as level increases, minimum 5.5s
		const levelDecay = Math.min(1.7, (safeLevel - 12) * 0.05);
		baseTime = Math.max(5.5, Math.round((7.2 - levelDecay) * 10) / 10);
		bonusTime = 0.8;
	}

	return {
		level: safeLevel,
		totalBubbles: BOARD_TOTAL_BUBBLES,
		activeCount,
		baseTime,
		bonusTime
	};
}
