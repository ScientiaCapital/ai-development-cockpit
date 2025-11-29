/**
 * ProjectsService - CRUD operations for user projects
 *
 * Provides:
 * - List user projects
 * - Get single project
 * - Create/update/delete projects
 * - Get project build history
 */

import { supabase } from '@/lib/supabase'
import type {
  Project,
  ProjectBuild,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/types/projects'

export class ProjectsService {
  /**
   * List all projects for the current user
   */
  static async listProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error listing projects:', error)
      throw new Error(`Failed to list projects: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single project by ID
   */
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error getting project:', error)
      throw new Error(`Failed to get project: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new project
   */
  static async createProject(input: CreateProjectInput): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated to create a project')
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description || null,
        user_request: input.user_request || null,
        github_repo_url: input.github_repo_url || null,
        github_repo_full_name: input.github_repo_full_name || null,
        status: 'draft',
        total_cost_usd: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing project
   */
  static async updateProject(
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      throw new Error(`Failed to update project: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      throw new Error(`Failed to delete project: ${error.message}`)
    }
  }

  /**
   * Get build history for a project
   */
  static async getProjectBuilds(projectId: string): Promise<ProjectBuild[]> {
    const { data, error } = await supabase
      .from('project_builds')
      .select('*')
      .eq('project_id', projectId)
      .order('build_number', { ascending: false })

    if (error) {
      console.error('Error getting project builds:', error)
      throw new Error(`Failed to get project builds: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new build for a project
   */
  static async createBuild(projectId: string): Promise<ProjectBuild> {
    // Get the next build number
    const { data: builds } = await supabase
      .from('project_builds')
      .select('build_number')
      .eq('project_id', projectId)
      .order('build_number', { ascending: false })
      .limit(1)

    const nextBuildNumber = (builds?.[0]?.build_number || 0) + 1

    const { data, error } = await supabase
      .from('project_builds')
      .insert({
        project_id: projectId,
        build_number: nextBuildNumber,
        status: 'pending',
        cost_usd: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating build:', error)
      throw new Error(`Failed to create build: ${error.message}`)
    }

    // Update project status to building
    await supabase
      .from('projects')
      .update({ status: 'building' })
      .eq('id', projectId)

    return data
  }

  /**
   * Update build status
   */
  static async updateBuild(
    buildId: string,
    updates: Partial<ProjectBuild>
  ): Promise<ProjectBuild> {
    const { data, error } = await supabase
      .from('project_builds')
      .update(updates)
      .eq('id', buildId)
      .select()
      .single()

    if (error) {
      console.error('Error updating build:', error)
      throw new Error(`Failed to update build: ${error.message}`)
    }

    return data
  }
}

export default ProjectsService
