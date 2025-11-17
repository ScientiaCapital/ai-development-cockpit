import { Octokit } from '@octokit/rest'

export class GitHubClient {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async getUserRepos() {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at
    }))
  }

  async getRepoContents(owner: string, repo: string, path: string = '') {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path
    })
    return data
  }
}
