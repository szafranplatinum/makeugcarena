'use client';

import { useState, useCallback } from 'react';
import { VideoProject } from '@/types';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated projects response
 */
export interface ProjectsResponse {
  data: VideoProject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Project filter options
 */
export interface ProjectFilters {
  status?: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed';
  type?: 'talking_head' | 'hook' | 'product_demo' | 'broll';
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Return value from useProjects hook
 */
export interface UseProjectsReturn {
  projects: VideoProject[];
  loading: boolean;
  error?: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Actions
  fetchProjects: (
    pagination?: Partial<PaginationParams>,
    filters?: ProjectFilters
  ) => Promise<void>;
  createProject: (data: Partial<VideoProject>) => Promise<VideoProject | null>;
  updateProject: (id: string, data: Partial<VideoProject>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

/**
 * Custom hook for managing video projects
 *
 * Features:
 * - Paginated project list fetching
 * - Create new projects
 * - Update project details
 * - Delete projects
 * - Filtering and sorting
 * - Pagination navigation
 * - Error handling
 * - Loading states
 *
 * Usage:
 * ```tsx
 * const {
 *   projects,
 *   loading,
 *   error,
 *   page,
 *   totalPages,
 *   fetchProjects,
 *   createProject,
 *   deleteProject,
 *   nextPage,
 * } = useProjects();
 *
 * useEffect(() => {
 *   fetchProjects();
 * }, []);
 *
 * const handleCreate = async () => {
 *   const project = await createProject({
 *     title: 'My Video',
 *     script: 'Hello world',
 *     type: 'talking_head',
 *   });
 *   if (project) {
 *     await fetchProjects();
 *   }
 * };
 *
 * return (
 *   <div>
 *     {loading && <p>Loading...</p>}
 *     {error && <p className="error">{error}</p>}
 *     {projects.map(project => (
 *       <ProjectCard
 *         key={project.id}
 *         project={project}
 *         onDelete={() => deleteProject(project.id)}
 *       />
 *     ))}
 *     <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
 *   </div>
 * );
 * ```
 */
export function useProjects(
  initialPageSize: number = 10
): UseProjectsReturn {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetches projects with optional pagination and filters
   */
  const fetchProjects = useCallback(
    async (
      pagination?: Partial<PaginationParams>,
      filters?: ProjectFilters
    ) => {
      try {
        setLoading(true);
        setError(undefined);

        const page = pagination?.page ?? 1;
        const pageSize = pagination?.pageSize ?? initialPageSize;

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (filters?.status) {
          params.append('status', filters.status);
        }
        if (filters?.type) {
          params.append('type', filters.type);
        }
        if (filters?.sortBy) {
          params.append('sortBy', filters.sortBy);
        }
        if (filters?.sortOrder) {
          params.append('sortOrder', filters.sortOrder);
        }

        const response = await fetch(`/api/videos?${params}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error(
            `Failed to fetch projects: ${response.statusText}`
          );
        }

        const data = (await response.json()) as ProjectsResponse;

        setProjects(data.data);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch projects';
        console.error('Projects fetch error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [initialPageSize]
  );

  /**
   * Creates a new project
   */
  const createProject = useCallback(
    async (data: Partial<VideoProject>): Promise<VideoProject | null> => {
      try {
        setError(undefined);

        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create project');
        }

        const created = await response.json();
        return created.data as VideoProject;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create project';
        console.error('Project creation error:', err);
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Updates a project
   */
  const updateProject = useCallback(
    async (id: string, data: Partial<VideoProject>): Promise<boolean> => {
      try {
        setError(undefined);

        const response = await fetch(`/api/videos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update project');
        }

        // Update local state
        setProjects((prev) =>
          prev.map((project) =>
            project.id === id ? { ...project, ...data } : project
          )
        );

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update project';
        console.error('Project update error:', err);
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  /**
   * Deletes a project
   */
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(undefined);

      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== id));

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete project';
      console.error('Project deletion error:', err);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(async () => {
    if (pagination.page < pagination.totalPages) {
      await fetchProjects({
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
      });
    }
  }, [pagination, fetchProjects]);

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(async () => {
    if (pagination.page > 1) {
      await fetchProjects({
        page: pagination.page - 1,
        pageSize: pagination.pageSize,
      });
    }
  }, [pagination, fetchProjects]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        await fetchProjects({
          page,
          pageSize: pagination.pageSize,
        });
      }
    },
    [pagination, fetchProjects]
  );

  return {
    projects,
    loading,
    error,
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    nextPage,
    previousPage,
    goToPage,
  };
}
