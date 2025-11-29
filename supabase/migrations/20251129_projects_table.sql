-- Projects table for Consumer SaaS feature
-- Created: 2025-11-29
-- Purpose: Store user projects with GitHub repo integration

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'building', 'ready', 'deployed', 'failed')),
  user_request TEXT,  -- Original plain English request
  github_repo_url TEXT,
  github_repo_full_name TEXT,  -- e.g., "username/repo-name"
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user-based lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own projects
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Project builds table (for build history)
CREATE TABLE IF NOT EXISTS project_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  build_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'success', 'failed')),
  cost_usd DECIMAL(10,6) DEFAULT 0,
  duration_ms INTEGER,
  agent_outputs JSONB,  -- Store agent outputs
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for fast project-based lookups
CREATE INDEX IF NOT EXISTS idx_project_builds_project_id ON project_builds(project_id);
CREATE INDEX IF NOT EXISTS idx_project_builds_status ON project_builds(status);

-- Enable Row Level Security
ALTER TABLE project_builds ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view builds for their own projects
CREATE POLICY "Users view own project builds" ON project_builds
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- RLS Policy: System can create builds (for API operations)
CREATE POLICY "System creates builds" ON project_builds
  FOR INSERT WITH CHECK (true);

-- Add onboarding fields to profiles table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'arcade';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT FALSE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update projects.updated_at
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE projects IS 'User projects for the Consumer SaaS feature';
COMMENT ON COLUMN projects.user_request IS 'The original plain English request from the user';
COMMENT ON COLUMN projects.github_repo_full_name IS 'Full repo name in format username/repo-name';
COMMENT ON TABLE project_builds IS 'Build history for each project';
COMMENT ON COLUMN project_builds.agent_outputs IS 'JSON blob containing outputs from each agent';
