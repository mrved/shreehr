import IORedis from 'ioredis';

// Redis connection singleton
let redisConnection: IORedis | null = null;

/**
 * Get Redis connection for BullMQ
 * Uses REDIS_URL env var, defaults to localhost
 */
export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });

    redisConnection.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisConnection.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  return redisConnection;
}

/**
 * Get connection options for BullMQ Queue/Worker
 */
export function getQueueConnection() {
  return {
    connection: getRedisConnection(),
  };
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
