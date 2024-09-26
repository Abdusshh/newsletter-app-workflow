import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getUserFrequency(email: string): Promise<number | null> {
  const data = await redis.get(`user:${email}`);
  console.log("User data:", data);
  if (!data) return null;

  const parsed = JSON.parse(JSON.stringify(data));
  return parsed.frequency;
}

export async function removeUser(email: string): Promise<void> {
  await redis.del(`user:${email}`);
}

export async function checkSubscription(email: string): Promise<boolean> {
  return (await getUserFrequency(email)) !== null;
}