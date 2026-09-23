import { getDatabase } from '../db';
import type { LeaderboardEntry, ScoreSubmissionPayload } from './types';

const COLLECTION_NAME = 'leaderboards';

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
	try {
		const db = await getDatabase();
		if (!db) {
			return [];
		}

		const entries = await db
			.collection<LeaderboardEntry>(COLLECTION_NAME)
			.find({})
			.sort({ score: -1, createdAt: 1 })
			.limit(Math.min(Math.max(1, limit), 100))
			.toArray();

		return entries;
	} catch (err) {
		console.warn('Leaderboard retrieval error:', err);
		return [];
	}
}

export async function submitScore(payload: ScoreSubmissionPayload): Promise<{ success: boolean; id?: string; message?: string }> {
	try {
		// Server-side validation
		if (!payload.playerName || typeof payload.playerName !== 'string') {
			return { success: false, message: 'Player name is required.' };
		}

		const sanitizedName = payload.playerName.trim().slice(0, 20);
		if (sanitizedName.length === 0) {
			return { success: false, message: 'Invalid player name.' };
		}

		const score = Math.max(0, Math.floor(Number(payload.score) || 0));
		const level = Math.max(1, Math.floor(Number(payload.level) || 1));

		const db = await getDatabase();
		if (!db) {
			return {
				success: false,
				message: 'MongoDB is currently offline. High score saved to localStorage only.'
			};
		}

		const document: LeaderboardEntry = {
			playerName: sanitizedName,
			score,
			level,
			maxCombo: payload.maxCombo ? Math.max(0, Math.floor(payload.maxCombo)) : undefined,
			bubblesPopped: payload.bubblesPopped ? Math.max(0, Math.floor(payload.bubblesPopped)) : undefined,
			duration: payload.duration ? Math.max(0, Number(payload.duration)) : undefined,
			createdAt: new Date()
		};

		const result = await db.collection<LeaderboardEntry>(COLLECTION_NAME).insertOne(document);
		return { success: true, id: result.insertedId.toString() };
	} catch (err) {
		console.warn('Leaderboard submission error:', err);
		return { success: false, message: 'Could not write to leaderboard.' };
	}
}
