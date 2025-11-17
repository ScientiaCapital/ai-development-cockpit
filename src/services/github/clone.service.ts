import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export interface CloneOptions {
  url: string
  destination: string
  branch?: string
  depth?: number
}

export class GitHubCloneService {
  async cloneRepository(options: CloneOptions): Promise<string> {
    const { url, destination, branch, depth = 1 } = options

    // Validate URL
    if (!url.startsWith('https://github.com/')) {
      throw new Error('Only GitHub HTTPS URLs are supported')
    }

    // Create destination directory
    await fs.mkdir(destination, { recursive: true })

    // Build git clone command
    const branchArg = branch ? `--branch ${branch}` : ''
    const depthArg = depth > 0 ? `--depth ${depth}` : ''
    const command = `git clone ${branchArg} ${depthArg} ${url} ${destination}`

    console.log(`🔄 Cloning repository: ${url}`)

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000 // 60 second timeout
      })

      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Clone stderr:', stderr)
      }

      console.log(`✅ Successfully cloned to ${destination}`)
      return destination
    } catch (error) {
      console.error('❌ Clone failed:', error)

      // Cleanup failed clone directory
      try {
        await fs.rm(destination, { recursive: true, force: true })
      } catch {}

      throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getClonePath(repoFullName: string): Promise<string> {
    // Generate unique path for this repo
    const safeName = repoFullName.replace(/[^a-z0-9-]/gi, '_')
    return path.join(
      process.env.CLONE_DIR || '/tmp/ai-dev-cockpit/clones',
      safeName
    )
  }

  async cleanupClone(clonePath: string): Promise<void> {
    try {
      await fs.rm(clonePath, { recursive: true, force: true })
      console.log(`🗑️ Cleaned up clone at ${clonePath}`)
    } catch (error) {
      console.error('Failed to cleanup clone:', error)
    }
  }
}
