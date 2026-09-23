import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

const uri = env.MONGODB_URI || process.env.MONGODB_URI || '';
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getDbClient(): Promise<MongoClient | null> {
	if (!uri) {
		return null;
	}

	if (client) {
		return client;
	}

	if (!clientPromise) {
		try {
			const mongoClient = new MongoClient(uri);
			clientPromise = mongoClient.connect().then((c) => {
				client = c;
				return c;
			});
		} catch (err) {
			console.warn('MongoDB connection failed to initiate:', err);
			return null;
		}
	}

	try {
		return await clientPromise;
	} catch (err) {
		console.warn('MongoDB connection error:', err);
		clientPromise = null;
		return null;
	}
}

export async function getDatabase(dbName = 'pop_it_time_attack') {
	const dbClient = await getDbClient();
	if (!dbClient) return null;
	return dbClient.db(dbName);
}
