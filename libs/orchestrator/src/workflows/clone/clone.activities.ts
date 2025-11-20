import { GitCliRepoProvider } from "../../../../platform-infra/src/git/git.provider";
import { WorkdirService } from "../../../../platform-infra/src/workdir/workdir.service"; 

const workdirService = new WorkdirService();

const provider = new GitCliRepoProvider(workdirService);


export async function resolveCommit(repoUrl: string, ref: string): Promise<string> {
  return provider.resolveCommit(repoUrl, ref);
}


export async function fetchSnapshot(repoUrl: string, sha: string): Promise<{ path: string }> {
  return provider.fetchSnapshot(repoUrl, sha);
}