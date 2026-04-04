'use client';

import { useEffect, useState } from 'react';
import { Script } from '@/types';
import { apiClient } from '@/lib/api-client';

export interface CreateScriptInput {
  title: string;
  content: string;
  language: string;
  tone: string;
}

export interface GenerateScriptInput {
  topic: string;
  language: string;
  tone: string;
  length?: 'short' | 'medium' | 'long';
}

export interface UseScriptsReturn {
  scripts: Script[];
  loading: boolean;
  error: string | null;
  generateLoading: boolean;
  generateError: string | null;
  fetchScripts: () => Promise<void>;
  createScript: (data: CreateScriptInput) => Promise<Script>;
  generateScript: (input: GenerateScriptInput) => Promise<Script>;
  deleteScript: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing scripts - CRUD operations and AI script generation
 * @returns scripts, loading/error states, and script management methods
 */
export function useScripts(): UseScriptsReturn {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get<Script[]>('/api/scripts');
      setScripts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch scripts';
      setError(message);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const createScript = async (data: CreateScriptInput): Promise<Script> => {
    try {
      setError(null);

      const newScript = await apiClient.post<Script>('/api/scripts', {
        title: data.title,
        content: data.content,
        language: data.language,
        tone: data.tone,
        is_ai_generated: false,
      });

      setScripts((prev) => [newScript, ...prev]);
      return newScript;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create script';
      setError(message);
      throw err;
    }
  };

  const generateScript = async (input: GenerateScriptInput): Promise<Script> => {
    try {
      setGenerateLoading(true);
      setGenerateError(null);

      const newScript = await apiClient.post<Script>('/api/scripts/generate', {
        topic: input.topic,
        language: input.language,
        tone: input.tone,
        length: input.length || 'medium',
      });

      setScripts((prev) => [newScript, ...prev]);
      return newScript;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate script';
      setGenerateError(message);
      throw err;
    } finally {
      setGenerateLoading(false);
    }
  };

  const deleteScript = async (id: string) => {
    try {
      setError(null);

      await apiClient.delete(`/api/scripts/${id}`);
      setScripts((prev) => prev.filter((script) => script.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete script';
      setError(message);
      throw err;
    }
  };

  return {
    scripts,
    loading,
    error,
    generateLoading,
    generateError,
    fetchScripts,
    createScript,
    generateScript,
    deleteScript,
    refetch: fetchScripts,
  };
}
