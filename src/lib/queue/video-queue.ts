/**
 * Job status enum
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Queue job interface
 */
export interface QueueJob {
  id: string;
  type: string; // 'video_generation', 'script_generation', etc.
  data: Record<string, unknown>;
  status: JobStatus;
  progress?: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: Record<string, unknown>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

/**
 * SimpleJobQueue - In-memory job queue for MVP
 *
 * WARNING: This is a simple in-memory implementation suitable only for MVP/testing.
 * For production use, replace with BullMQ + Redis.
 *
 * Limitations of in-memory queue:
 * - Jobs are lost on application restart
 * - Not suitable for multi-instance deployments
 * - No persistence or recovery
 * - Limited scalability
 *
 * Production replacement with BullMQ:
 * - Persistent job storage in Redis
 * - Worker processes with multiple instances
 * - Job priority and scheduling
 * - Dead-letter queues and retries
 * - Real-time job monitoring
 */
export class SimpleJobQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private jobProcessors: Map<
    string,
    (job: QueueJob) => Promise<Record<string, unknown>>
  > = new Map();
  private processingJobs = new Set<string>();

  /**
   * Registers a job processor for a specific job type
   */
  registerProcessor(
    jobType: string,
    processor: (job: QueueJob) => Promise<Record<string, unknown>>
  ): void {
    this.jobProcessors.set(jobType, processor);
    console.log(`[Queue] Registered processor for job type: ${jobType}`);
  }

  /**
   * Adds a new job to the queue
   */
  async addJob(type: string, data: Record<string, unknown>): Promise<string> {
    const jobId = this.generateJobId();

    const job: QueueJob = {
      id: jobId,
      type,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    console.log(
      `[Queue] Added job ${jobId} of type ${type} to queue (total: ${this.jobs.size})`
    );

    // Automatically start processing in background
    this.processPendingJobs();

    return jobId;
  }

  /**
   * Processes a specific job by ID
   * Finds and executes the registered processor for that job type
   */
  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'processing' || job.status === 'completed') {
      console.log(
        `[Queue] Job ${jobId} is already ${job.status}, skipping`
      );
      return;
    }

    if (this.processingJobs.has(jobId)) {
      console.log(`[Queue] Job ${jobId} is already being processed`);
      return;
    }

    // Mark as processing
    job.status = 'processing';
    job.startedAt = new Date();
    this.processingJobs.add(jobId);

    console.log(`[Queue] Starting processing of job ${jobId} (${job.type})`);

    try {
      // Find processor for this job type
      const processor = this.jobProcessors.get(job.type);
      if (!processor) {
        throw new Error(
          `No processor registered for job type: ${job.type}`
        );
      }

      // Execute processor
      const result = await processor(job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      job.progress = 100;

      console.log(
        `[Queue] Job ${jobId} completed successfully in ${Math.round((job.completedAt.getTime() - job.startedAt!.getTime()) / 1000)}s`
      );
    } catch (error) {
      // Mark as failed
      job.status = 'failed';
      job.completedAt = new Date();
      job.error =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error(
        `[Queue] Job ${jobId} failed: ${job.error}`
      );
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  /**
   * Processes all pending jobs in sequence
   */
  private async processPendingJobs(): Promise<void> {
    // Find all pending jobs
    const pendingJobs = Array.from(this.jobs.values()).filter(
      (job) => job.status === 'pending'
    );

    // Process each pending job
    for (const job of pendingJobs) {
      await this.processJob(job.id);
    }
  }

  /**
   * Gets status of a specific job
   */
  getJobStatus(jobId: string): QueueJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Updates job progress
   * Used by job processors to report progress
   */
  updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.min(100, Math.max(0, progress));
    }
  }

  /**
   * Gets queue statistics
   */
  getQueueStats(): QueueStats {
    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: this.jobs.size,
    };

    for (const job of this.jobs.values()) {
      stats[job.status]++;
    }

    return stats;
  }

  /**
   * Gets all jobs with optional filtering
   */
  getAllJobs(filter?: {
    status?: JobStatus;
    type?: string;
    limit?: number;
  }): QueueJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter((job) => job.status === filter.status);
    }

    if (filter?.type) {
      jobs = jobs.filter((job) => job.type === filter.type);
    }

    if (filter?.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    // Return sorted by creation date (newest first)
    return jobs.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Retries a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'failed') {
      throw new Error(
        `Cannot retry job with status ${job.status}. Only failed jobs can be retried.`
      );
    }

    // Reset to pending
    job.status = 'pending';
    job.error = undefined;
    job.result = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.progress = 0;

    console.log(`[Queue] Retrying failed job ${jobId}`);

    // Start processing
    await this.processJob(jobId);
  }

  /**
   * Clears all completed jobs (cleanup)
   */
  clearCompleted(): number {
    let cleared = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed') {
        this.jobs.delete(jobId);
        cleared++;
      }
    }
    console.log(`[Queue] Cleared ${cleared} completed jobs`);
    return cleared;
  }

  /**
   * Clears all jobs from the queue (use with caution)
   */
  clearAll(): void {
    this.jobs.clear();
    this.processingJobs.clear();
    console.log('[Queue] Cleared all jobs from queue');
  }

  /**
   * Generates a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Export singleton instance
 * Use this throughout the application for job queuing
 */
export const videoQueue = new SimpleJobQueue();

/**
 * MIGRATION GUIDE: From SimpleJobQueue to BullMQ (Production)
 *
 * When migrating to production, replace SimpleJobQueue with BullMQ:
 *
 * 1. Install dependencies:
 *    npm install bull redis
 *
 * 2. Create BullMQ queue wrapper:
 *    // src/lib/queue/bull-video-queue.ts
 *    import Bull from 'bull';
 *
 *    export const videoQueue = new Bull('video-generation', {
 *      redis: {
 *        host: process.env.REDIS_HOST || 'localhost',
 *        port: parseInt(process.env.REDIS_PORT || '6379'),
 *      },
 *    });
 *
 * 3. Register processors:
 *    videoQueue.process('video_generation', 5, processor);
 *
 * 4. Update import in application:
 *    // Change from:
 *    import { videoQueue } from '@/lib/queue/video-queue';
 *    // To:
 *    import { videoQueue } from '@/lib/queue/bull-video-queue';
 *
 * Benefits of BullMQ:
 * - Persistent job storage with recovery
 * - Distributed job processing across multiple workers
 * - Built-in retries with exponential backoff
 * - Dead-letter queues
 * - Priority-based job processing
 * - Job events and real-time monitoring
 * - Rate limiting
 */
