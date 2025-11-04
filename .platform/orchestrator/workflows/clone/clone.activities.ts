import { GitCliRepoProvider } from "../../../../libs/codebase/src/infra/git/git.provider";
import { WorkdirService } from "../../../../libs/codebase/src/infra/storage/workdir.service"; 

const workdirService = new WorkdirService();

const provider = new GitCliRepoProvider(workdirService);


export async function resolveCommit(repoUrl: string, ref: string): Promise<string> {
  return provider.resolveCommit(repoUrl, ref);
}


export async function fetchSnapshot(repoUrl: string, sha: string): Promise<{ path: string }> {
  return provider.fetchSnapshot(repoUrl, sha);
}