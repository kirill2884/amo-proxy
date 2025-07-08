import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }

  client = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 10000 },
  });

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  await client.connect();
  return client;
}