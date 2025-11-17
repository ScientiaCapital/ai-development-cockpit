import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('ProjectWorkspace', () => {
  let workspace: ProjectWorkspace
  const projectId = 'test-project-123'

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup()
    }
  })

  it('should create temporary workspace directory', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    expect(workspace.rootDir).toContain(projectId)
    const exists = await fs.access(workspace.rootDir).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })

  it('should write and read files', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    await workspace.writeFile('src/test.ts', 'export const foo = "bar"')
    const content = await workspace.readFile('src/test.ts')

    expect(content).toBe('export const foo = "bar"')
  })

  it('should list all files', async () => {
    workspace = await ProjectWorkspace.create(projectId)

    await workspace.writeFile('src/a.ts', 'a')
    await workspace.writeFile('src/b.ts', 'b')
    await workspace.writeFile('test/c.test.ts', 'c')

    const files = await workspace.listFiles()

    expect(files).toContain('src/a.ts')
    expect(files).toContain('src/b.ts')
    expect(files).toContain('test/c.test.ts')
  })

  it('should cleanup workspace', async () => {
    workspace = await ProjectWorkspace.create(projectId)
    const workspaceDir = workspace.rootDir

    await workspace.cleanup()

    const exists = await fs.access(workspaceDir).then(() => true).catch(() => false)
    expect(exists).toBe(false)
  })

  describe('Security', () => {
    it('should prevent path traversal attacks in writeFile', async () => {
      workspace = await ProjectWorkspace.create(projectId)
      await expect(
        workspace.writeFile('../../../tmp/evil.txt', 'malicious')
      ).rejects.toThrow('Path traversal detected')
    })

    it('should prevent path traversal attacks in readFile', async () => {
      workspace = await ProjectWorkspace.create(projectId)
      await expect(
        workspace.readFile('../../../etc/passwd')
      ).rejects.toThrow('Path traversal detected')
    })

    it('should prevent path traversal attacks in fileExists', async () => {
      workspace = await ProjectWorkspace.create(projectId)
      await expect(
        workspace.fileExists('../../../etc/passwd')
      ).rejects.toThrow('Path traversal detected')
    })

    it('should prevent path traversal attacks in getAbsolutePath', () => {
      return ProjectWorkspace.create(projectId).then((ws) => {
        workspace = ws
        expect(() => {
          workspace.getAbsolutePath('../../../tmp/evil.txt')
        }).toThrow('Path traversal detected')
      })
    })

    it('should reject invalid project IDs with special characters', async () => {
      await expect(
        ProjectWorkspace.create('../../../etc')
      ).rejects.toThrow('Invalid projectId')
    })

    it('should reject invalid project IDs with slashes', async () => {
      await expect(
        ProjectWorkspace.create('foo/bar')
      ).rejects.toThrow('Invalid projectId')
    })

    it('should reject empty project IDs', async () => {
      await expect(
        ProjectWorkspace.create('')
      ).rejects.toThrow('Invalid projectId')
    })

    it('should accept valid project IDs', async () => {
      workspace = await ProjectWorkspace.create('valid-project_123')
      expect(workspace.projectId).toBe('valid-project_123')
    })
  })
})
