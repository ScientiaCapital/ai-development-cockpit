/**
 * Project types for Consumer SaaS feature
 */

export type ProjectStatus = 'draft' | 'building' | 'ready' | 'deployed' | 'failed'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: ProjectStatus
  user_request: string | null
  github_repo_url: string | null
  github_repo_full_name: string | null
  total_cost_usd: number
  created_at: string
  updated_at: string
}

export interface ProjectBuild {
  id: string
  project_id: string
  build_number: number
  status: 'pending' | 'running' | 'success' | 'failed'
  cost_usd: number
  duration_ms: number | null
  agent_outputs: Record<string, unknown> | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface CreateProjectInput {
  name: string
  description?: string
  user_request?: string
  github_repo_url?: string
  github_repo_full_name?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  user_request?: string
  github_repo_url?: string
  github_repo_full_name?: string
  total_cost_usd?: number
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  default_branch: string
  updated_at: string
}
