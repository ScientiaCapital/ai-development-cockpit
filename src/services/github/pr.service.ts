import { Octokit } from '@octokit/rest'

export interface PRFile {
  path: string
  content: string
}

export interface CreatePROptions {
  owner: string
  repo: string
  branchName: string
  baseBranch: string
  title: string
  body: string
  files: PRFile[]
}

export interface PRResult {
  url: string
  number: number
}

export class GitHubPRService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async createPullRequest(options: CreatePROptions): Promise<PRResult> {
    const { owner, repo, branchName, baseBranch, title, body, files } = options

    console.log(`🔄 Creating PR: ${owner}/${repo} (${branchName} → ${baseBranch})`)

    // Step 1: Get base branch SHA
    const { data: baseBranchData } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch: baseBranch
    })

    const baseSha = baseBranchData.commit.sha

    // Step 2: Create new branch
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })

    console.log(`✅ Created branch: ${branchName}`)

    // Step 3: Commit files to new branch
    for (const file of files) {
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        message: `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
        branch: branchName
      })
    }

    console.log(`✅ Committed ${files.length} files`)

    // Step 4: Create pull request
    const { data: pr } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body: `${body}\n\n---\n🤖 Generated with [AI Development Cockpit](https://github.com/ScientiaCapital/ai-development-cockpit)`,
      head: branchName,
      base: baseBranch
    })

    console.log(`✅ Created PR #${pr.number}: ${pr.html_url}`)

    return {
      url: pr.html_url,
      number: pr.number
    }
  }
}
