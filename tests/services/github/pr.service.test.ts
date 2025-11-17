import { GitHubPRService } from '@/services/github/pr.service'

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      createOrUpdateFileContents: jest.fn().mockResolvedValue({ data: {} }),
      getBranch: jest.fn().mockResolvedValue({ data: { commit: { sha: 'abc123' } } })
    },
    git: {
      createRef: jest.fn().mockResolvedValue({ data: {} })
    },
    pulls: {
      create: jest.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/owner/repo/pull/1',
          number: 1
        }
      })
    }
  }))
}))

describe('GitHubPRService', () => {
  let service: GitHubPRService

  beforeEach(() => {
    service = new GitHubPRService('fake-token')
  })

  it('should create a pull request', async () => {
    const result = await service.createPullRequest({
      owner: 'testowner',
      repo: 'testrepo',
      branchName: 'feature/ai-generated',
      baseBranch: 'main',
      title: 'AI Generated Feature',
      body: 'This PR contains AI-generated code',
      files: [
        { path: 'src/test.ts', content: 'console.log("test")' }
      ]
    })

    expect(result.url).toBe('https://github.com/owner/repo/pull/1')
    expect(result.number).toBe(1)
  })
})
