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
})
