export type GameState = 'idle' | 'playing' | 'level-clear' | 'game-over';

export interface Bubble {
	id: number;
	active: boolean; // true if this bubble is illuminated / target for this level
	pressed: boolean;
	colorIndex?: number;
}

export interface LevelConfig {
	level: number;
	totalBubbles: number; // total bubbles on the board tray
	activeCount: number; // how many are randomly lit up
	baseTime: number; // in seconds
	bonusTime: number; // in seconds
}

export interface ScoreBreakdown {
	poppedPoints: number;
	levelPoints: number;
	comboPoints: number;
	timePoints: number;
	total: number;
}

export interface SoundState {
	enabled: boolean;
	volume: number;
}

export interface GameSnapshot {
	state: GameState;
	level: number;
	bubbles: Bubble[];
	totalBubbles: number;
	activeCount: number; // target count to pop
	pressedCount: number; // pressed target count
	remainingTime: number; // seconds with 2 decimal places
	baseTime: number;
	score: number;
	combo: number;
	maxCombo: number;
	bestScore: number;
	bestLevel: number;
	timeBonusAwarded: number;
	isNewBest: boolean;
}
