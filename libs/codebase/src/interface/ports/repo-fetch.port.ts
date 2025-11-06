export interface RepoFetchPort {
  resolveCommit(repoUrl: string, ref: string): Promise<string>;
  fetchSnapshot(repoUrl: string, sha: string, dstDir?: string): Promise<{ path: string }>;
}