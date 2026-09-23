import type { LevelConfig } from './types';

export const BOARD_TOTAL_BUBBLES = 20; // Standard 4x5 physical Pop It tray

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
		baseTime = Math.round((6.5 + safeLevel * 0.3) * 10) / 10; // 6.8s -> 10.1s
		bonusTime = safeLevel <= 5 ? 2.0 : 2.5;
	} else {
		// Endless high-speed tiers:
		// Active targets oscillate between 15 and 18 for variety
		const cycle = (safeLevel - 13) % 4;
		activeCount = 15 + cycle; // 15, 16, 17, 18
		
		// Gradually tighten base time as level increases, minimum 7.5s
		const levelDecay = Math.min(2.5, (safeLevel - 12) * 0.05);
		baseTime = Math.max(7.5, Math.round((10.0 - levelDecay) * 10) / 10);
		bonusTime = 2.2;
	}

	return {
		level: safeLevel,
		totalBubbles: BOARD_TOTAL_BUBBLES,
		activeCount,
		baseTime,
		bonusTime
	};
}
