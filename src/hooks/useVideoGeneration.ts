'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Video generation status
 */
export interface VideoGenerationStatus {
  status: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  error?: string;
  output?: {
    outputUrl: string;
    thumbnailUrl: string;
    subtitleUrl?: string;
    duration?: number;
  };
}

/**
 * Return value from useVideoGeneration hook
 */
export interface UseVideoGenerationReturn {
  status: VideoGenerationStatus['status'];
  progress: number;
  estimatedTime?: number;
  error?: string;
  output?: VideoGenerationStatus['output'];
  isGenerating: boolean;
  isPending: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  startGeneration: () => Promise<void>;
  stopPolling: () => void;
}

/**
 * Custom hook for managing video generation status polling
 *
 * Features:
 * - Automatic polling every 3 seconds during generation
 * - Real-time progress tracking
 * - Estimated time remaining calculation
 * - Auto-stops polling when completed or failed
 * - Cleanup on component unmount
 * - Handles errors gracefully
 *
 * Usage:
 * ```tsx
 * const {
 *   status,
 *   progress,
 *   estimatedTime,
 *   error,
 *   isGenerating,
 *   startGeneration,
 * } = useVideoGeneration(projectId);
 *
 * return (
 *   <div>
 *     <button onClick={startGeneration} disabled={isGenerating}>
 *       Generate Video
 *     </button>
 *     {isGenerating && (
 *       <div>
 *         <ProgressBar value={progress} />
 *         <p>{estimatedTime}s remaining</p>
 *       </div>
 *     )}
 *     {error && <p className="error">{error}</p>}
 *   </div>
 * );
 * ```
 */
export function useVideoGeneration(projectId: string): UseVideoGenerationReturn {
  const [status, setStatus] = useState<VideoGenerationStatus['status']>('draft');
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number>();
  const [error, setError] = useState<string>();
  const [output, setOutput] = useState<VideoGenerationStatus['output']>();
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  // Calculate status flags
  const isGenerating = status === 'processing' || status === 'rendering';
  const isPending = status === 'draft';
  const isProcessing = status === 'processing' || status === 'rendering';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  /**
   * Fetches current generation status from API
   */
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos/${projectId}/status`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized - please log in');
          setIsPolling(false);
          return;
        }
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
        setProgress(data.progress || 0);
        setEstimatedTime(data.estimatedTimeRemaining);
        setError(data.error || undefined);
        setOutput(data.output);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
        }
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch status';
      console.error('Status polling error:', err);
      setError(errorMessage);
    }
  }, [projectId]);

  /**
   * Starts polling for status updates
   * Called after generation is triggered
   */
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    setError(undefined);

    // Fetch immediately, then set up interval
    fetchStatus();

    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 3000); // Poll every 3 seconds
  }, [isPolling, fetchStatus]);

  /**
   * Stops polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
    setIsPolling(false);
  }, []);

  /**
   * Triggers video generation
   */
  const startGeneration = useCallback(async () => {
    try {
      setError(undefined);
      setProgress(0);

      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start generation');
      }

      // Start polling for status
      startPolling();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start generation';
      console.error('Generation start error:', err);
      setError(errorMessage);
    }
  }, [projectId, startPolling]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    progress,
    estimatedTime,
    error,
    output,
    isGenerating,
    isPending,
    isProcessing,
    isCompleted,
    isFailed,
    startGeneration,
    stopPolling,
  };
}
