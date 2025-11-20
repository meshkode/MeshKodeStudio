import { sh } from "./git.exec";
import { WorkdirService } from "../workdir/workdir.service"; 

export class GitCliRepoProvider {
  private readonly timeout = 60_000;

  constructor(private readonly workdir: WorkdirService) {}

  async resolveCommit(repoUrl: string, ref: string): Promise<string> {
    const { stdout } = await sh("git", ["ls-remote", repoUrl, ref], undefined, this.timeout);

    const line = stdout.split("\n").find(Boolean);
    if (line) return line.split("\t")[0].trim();

    const heads = await sh("git", ["ls-remote", repoUrl, `refs/heads/${ref}`], undefined, this.timeout)
      .catch(() => ({ stdout: "", stderr: "" })); 

    const headLine = heads.stdout.split("\n").find(Boolean);
    if (headLine) return headLine.split("\t")[0].trim();

    const tags = await sh("git", ["ls-remote", repoUrl, `refs/tags/${ref}`], undefined, this.timeout)
      .catch(() => ({ stdout: "", stderr: "" })); 

    const tagLine = tags.stdout.split("\n").find(Boolean);
    if (tagLine) return tagLine.split("\t")[0].trim();

    throw new Error(`ref not found: ${ref}`);
  }

  async fetchSnapshot(repoUrl: string, sha: string, dstDir?: string): Promise<{ path: string }> {
    const root = dstDir ?? this.workdir.make("repo");

    await sh("git", ["init"], root, this.timeout);
    await sh("git", ["remote", "add", "origin", repoUrl], root, this.timeout);
    await sh("git", ["fetch", "--depth", "1", "origin", sha], root, this.timeout);
    await sh("git", ["checkout", sha], root, this.timeout);

    return { path: root };
  }
}