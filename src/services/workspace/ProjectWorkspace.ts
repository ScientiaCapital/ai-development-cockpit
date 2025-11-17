import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export class ProjectWorkspace {
  private constructor(
    public readonly projectId: string,
    public readonly rootDir: string
  ) {}

  static async create(projectId: string): Promise<ProjectWorkspace> {
    const rootDir = path.join(os.tmpdir(), 'ai-cockpit-projects', projectId)
    await fs.mkdir(rootDir, { recursive: true })

    return new ProjectWorkspace(projectId, rootDir)
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath)
    const dir = path.dirname(fullPath)

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true })

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath)
    return fs.readFile(fullPath, 'utf-8')
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.rootDir, relativePath)
    return fs.access(fullPath).then(() => true).catch(() => false)
  }

  async listFiles(): Promise<string[]> {
    const files: string[] = []

    async function walk(dir: string, baseDir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await walk(fullPath, baseDir)
        } else {
          const relativePath = path.relative(baseDir, fullPath)
          files.push(relativePath)
        }
      }
    }

    await walk(this.rootDir, this.rootDir)
    return files
  }

  async cleanup(): Promise<void> {
    await fs.rm(this.rootDir, { recursive: true, force: true })
  }

  getAbsolutePath(relativePath: string): string {
    return path.join(this.rootDir, relativePath)
  }
}
