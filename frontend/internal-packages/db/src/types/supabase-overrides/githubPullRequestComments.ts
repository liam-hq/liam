export interface GithubPullRequestCommentsOverride {
  public: {
    Tables: {
      github_pull_request_comments: {
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
