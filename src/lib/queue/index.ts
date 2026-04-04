/**
 * Job Queue System
 *
 * Central export point for job queue functionality.
 * Currently uses SimpleJobQueue for MVP.
 *
 * When ready to migrate to production:
 * - Replace with BullMQ + Redis
 * - See migration guide in video-queue.ts
 */

export {
  SimpleJobQueue,
  videoQueue,
  type QueueJob,
  type JobStatus,
  type QueueStats,
} from './video-queue';
