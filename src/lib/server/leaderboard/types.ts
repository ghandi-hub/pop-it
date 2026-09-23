import type { ObjectId } from 'mongodb';

export interface LeaderboardEntry {
	_id?: ObjectId | string;
	playerName: string;
	score: number;
	level: number;
	maxCombo?: number;
	bubblesPopped?: number;
	duration?: number;
	createdAt: Date;
	updatedAt?: Date;
}

export interface ScoreSubmissionPayload {
	playerName: string;
	score: number;
	level: number;
	maxCombo?: number;
	bubblesPopped?: number;
	duration?: number;
}
