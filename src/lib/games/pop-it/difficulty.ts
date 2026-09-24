import type { LevelConfig } from './types';

export const BOARD_TOTAL_BUBBLES = 20; // Standard 4x5 physical Pop It tray
export const MAX_TIMER_CAP = 8.5; // Maximum time in seconds a player can accumulate

/**
 * Endless level generator:
 * - Dynamically scales for Level 1, 2, 3 ... 50, 100+ without any upper limit.
 * - Randomly lights up a subset of bubbles (activeCount), scaling from 4 up to 18.
 * - Base time and bonus time are balanced to keep tension without punishing too harshly.
 */
export function getLevelConfig(level: number): LevelConfig {
	const safeLevel = Math.max(1, Math.floor(level));

	let activeCount: number;
	let baseTime: number;
	let bonusTime: number;

	if (safeLevel <= 12) {
		// Progressive ramp up: 4, 5, 6, 7, ... 15 active targets
		activeCount = Math.min(15, 3 + safeLevel);
		// Level 1: 5.5s, Level 5: 6.3s, Level 12: 7.7s
		baseTime = Math.round((5.3 + safeLevel * 0.2) * 10) / 10;
		// Generous clear bonus to sustain momentum while capped by MAX_TIMER_CAP
		bonusTime = safeLevel <= 3 ? 2.0 : safeLevel <= 7 ? 1.8 : safeLevel <= 12 ? 1.5 : 1.3;
	} else {
		// Endless high-speed tiers:
		// Active targets oscillate between 15 and 18 for variety
		const cycle = (safeLevel - 13) % 4;
		activeCount = 15 + cycle; // 15, 16, 17, 18
		
		// Gradually tighten base time as level increases, minimum 6.0s
		const levelDecay = Math.min(1.5, (safeLevel - 12) * 0.05);
		baseTime = Math.max(6.0, Math.round((7.7 - levelDecay) * 10) / 10);
		bonusTime = safeLevel <= 20 ? 1.3 : 1.1;
	}

	return {
		level: safeLevel,
		totalBubbles: BOARD_TOTAL_BUBBLES,
		activeCount,
		baseTime,
		bonusTime
	};
}
