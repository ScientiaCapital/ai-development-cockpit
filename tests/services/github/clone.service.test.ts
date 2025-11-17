import { GitHubCloneService } from '@/services/github/clone.service'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('GitHubCloneService', () => {
  let service: GitHubCloneService
  let testDir: string

  beforeEach(() => {
    service = new GitHubCloneService()
    testDir = path.join(os.tmpdir(), `test-clone-${Date.now()}`)
  })

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {}
  })

  it('should clone a public repository', async () => {
    const repoPath = await service.cloneRepository({
      url: 'https://github.com/octocat/Hello-World',
      destination: testDir
    })

    expect(repoPath).toBe(testDir)

    // Verify .git directory exists
    const gitPath = path.join(testDir, '.git')
    const stats = await fs.stat(gitPath)
    expect(stats.isDirectory()).toBe(true)
  }, 30000) // 30 second timeout for clone

  it('should handle clone errors gracefully', async () => {
    await expect(
      service.cloneRepository({
        url: 'https://github.com/invalid/nonexistent-repo-xyz',
        destination: testDir
      })
    ).rejects.toThrow()
  })
})
