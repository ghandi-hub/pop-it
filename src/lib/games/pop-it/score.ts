export const COMBO_TIMEOUT_MS = 600;

export const POINTS_PER_BUBBLE = 10;
export const POINTS_PER_LEVEL = 100;
export const POINTS_PER_SECOND_REMAINING = 15;

export interface PopResult {
	pointsAwarded: number;
	combo: number;
	comboTimeBonus: number; // bonus seconds earned from hitting a combo milestone
	isMilestone: boolean;
}

export function calculateBubblePopScore(currentCombo: number): PopResult {
	const newCombo = currentCombo + 1;
	let points = POINTS_PER_BUBBLE;
	let comboTimeBonus = 0;
	let isMilestone = false;

	// Scale points with combo multiplier
	if (newCombo >= 2) {
		points += Math.min(newCombo * 5, 100);
	}

	// Combo milestones matching PRD section 16:
	// x5 -> +0.2s, x10 -> +0.5s, x20 -> +1.0s, and every +10 afterwards -> +1.0s
	if (newCombo === 5) {
		comboTimeBonus = 0.2;
		isMilestone = true;
	} else if (newCombo === 10) {
		comboTimeBonus = 0.5;
		isMilestone = true;
	} else if (newCombo === 20 || (newCombo > 20 && newCombo % 10 === 0)) {
		comboTimeBonus = 1.0;
		isMilestone = true;
	}

	return {
		pointsAwarded: points,
		combo: newCombo,
		comboTimeBonus,
		isMilestone
	};
}

export function calculateLevelClearScore(level: number, remainingTime: number): number {
	const levelBonus = level * POINTS_PER_LEVEL;
	const timeBonus = Math.max(0, Math.round(remainingTime * POINTS_PER_SECOND_REMAINING));
	return levelBonus + timeBonus;
}
