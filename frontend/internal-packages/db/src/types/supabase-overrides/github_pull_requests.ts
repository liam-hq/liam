export interface GithubPullRequestsOverride {
  public: {
    Tables: {
      github_pull_requests: {
        Insert: {
          organization_id?: string | null
        }
        Update: {
          organization_id?: string | null
        }
      }
    }
  }
}
