export interface User {
  id: string
  github_id: string
  github_login: string | null
  email: string | null
  created_at: string
}

export interface Repo {
  id: string
  user_id: string
  github_repo_id: string
  owner: string
  name: string
  full_name: string
  connected_at: string
}

export interface Digest {
  id: string
  repo_id: string
  period_start: string | null
  period_end: string | null
  summary: string | null
  pr_count: number
  merged_count: number
  open_count: number
  avg_cycle_time_hours: number | null
  avg_review_time_hours: number | null
  pr_size_distribution: SizeDistribution
  stale_pr_count: number
  failed_job_names: string[]
  release_notes: string | null
  raw_data: RawData
  created_at: string
}

export interface SizeDistribution {
  xs: number
  s: number
  m: number
  l: number
}

export interface RawData {
  prs: PullRequest[]
  workflow_runs: WorkflowRun[]
  key_changes: string[]
}

export interface PullRequest {
  number: number
  title: string
  state: string
  merged: boolean
  merged_at: string | null
  created_at: string
  updated_at: string
  author: string
  additions: number
  deletions: number
  labels: string[]
  size: 'XS' | 'S' | 'M' | 'L'
  cycle_time_hours: number | null
  review_time_hours: number | null
  is_stale: boolean
}

export interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  created_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  description: string | null
  updated_at: string | null
}

export interface ContributorStat {
  author: string
  prs: number
  merged: number
  rate: number
}
