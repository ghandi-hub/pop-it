export type GameState = 'idle' | 'countdown' | 'playing' | 'level-clear' | 'game-over';

export type BubbleType = 'normal' | 'hazard' | 'golden';

export interface Bubble {
	id: number;
	active: boolean; // true if this bubble is illuminated / interactive for this level
	pressed: boolean;
	type?: BubbleType;
	colorIndex?: number;
	goldenTimeLeft?: number;
	isExpiring?: boolean;
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

export interface GameFeedbackEvent {
	type: 'hazard' | 'golden' | 'combo' | 'miss';
	message: string;
	timestamp: number;
}

export interface GameSnapshot {
	state: GameState;
	level: number;
	countdown: number; // 3, 2, 1, or 0 (GO)
	bubbles: Bubble[];
	totalBubbles: number;
	activeCount: number; // target count to pop (normal + golden)
	hazardCount: number; // active hazard/bomb count on the board
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
	lastFeedback?: GameFeedbackEvent | null;
}
