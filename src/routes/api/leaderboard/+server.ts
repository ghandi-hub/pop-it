import { json, type RequestHandler } from '@sveltejs/kit';
import { getLeaderboard, submitScore } from '$lib/server/leaderboard/repository';
import type { ScoreSubmissionPayload } from '$lib/server/leaderboard/types';

export const GET: RequestHandler = async ({ url }) => {
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? parseInt(limitParam, 10) : 10;

	const entries = await getLeaderboard(isNaN(limit) ? 10 : limit);

	return json({
		success: true,
		data: entries
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as ScoreSubmissionPayload;
		if (!body || typeof body !== 'object') {
			return json({ success: false, error: 'Invalid payload' }, { status: 400 });
		}

		const result = await submitScore(body);
		if (!result.success) {
			return json({ success: false, message: result.message }, { status: 200 });
		}

		return json({ success: true, id: result.id });
	} catch {
		return json({ success: false, error: 'Malformed request JSON' }, { status: 400 });
	}
};
