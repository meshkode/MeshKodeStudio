import { GitCliRepoProvider } from "./git.provider";
import * as exec from "./git.exec";
import { WorkdirService } from "../workdir/workdir.service"; 
import {
  LS_REMOTE_HEADS_MAIN,
  LS_REMOTE_TAG_V1,
} from "../../../testing/src/git/fixtures";

const REPO_URL = "https://example.com/repo.git";

jest.mock("../git/git.exec", () => ({
  sh: jest.fn(),
}));
jest.mock("../storage/workdir.service");


describe("GitCliRepoProvider (Unit Test with Mocks)", () => {
  jest.setTimeout(5000);

  let provider: GitCliRepoProvider;
  let shMock: jest.Mock;
  let mockWorkdirService: jest.Mocked<WorkdirService>;

  beforeEach(() => {
    jest.clearAllMocks(); 

    mockWorkdirService = new WorkdirService() as jest.Mocked<WorkdirService>;
    
    provider = new GitCliRepoProvider(mockWorkdirService); 
    
    shMock = (exec.sh as jest.Mock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  test("resolves sha from explicit ref", async () => {
    const fakeSha = "a1b2c3";
    shMock.mockResolvedValue({ stdout: `${fakeSha}\trefs/heads/main\n`, stderr: "" });

    const sha = await provider.resolveCommit(REPO_URL, "main");

    expect(sha).toBe(fakeSha);
    expect(shMock).toHaveBeenCalledTimes(1);
    expect(shMock).toHaveBeenCalledWith(
      "git",
      ["ls-remote", REPO_URL, "main"],
      undefined,
      60000
    );
  });

  test("resolves sha from heads when ref not found", async () => {
    shMock
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: LS_REMOTE_HEADS_MAIN, stderr: "" });

    const sha = await provider.resolveCommit(REPO_URL, "main");

    expect(sha).toBe("a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4");
    expect(shMock).toHaveBeenCalledTimes(2);
  });

  test("resolves sha from tags", async () => {
    shMock
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: LS_REMOTE_TAG_V1, stderr: "" });

    const sha = await provider.resolveCommit(REPO_URL, "v1.0.0");

    expect(sha).toBe("e5f6g7h8e5f6g7h8e5f6g7h8e5f6g7h8e5f6g7h8");
    expect(shMock).toHaveBeenCalledTimes(3);
  });

  test("throws on missing ref", async () => {
    shMock.mockResolvedValue({ stdout: "", stderr: "" });

    await expect(provider.resolveCommit(REPO_URL, "y")).rejects.toThrow(/ref not found: y/);
    expect(shMock).toHaveBeenCalledTimes(3);
  });


  test("fetches shallow snapshot", async () => {
    const fakePath = "/tmp/fake-repo-123";
    const calls: Array<{ args: string[]; cwd?: string }> = [];

    shMock.mockImplementation(async (cmd: string, args: string[], cwd?: string) => {
      calls.push({ args, cwd });
      return { stdout: "", stderr: "" };
    });
    mockWorkdirService.make.mockReturnValue(fakePath); 

    const out = await provider.fetchSnapshot(REPO_URL, "deadbeef");

    expect(out.path).toBe(fakePath); 
    expect(mockWorkdirService.make).toHaveBeenCalledTimes(1);
    expect(mockWorkdirService.make).toHaveBeenCalledWith("repo");
    const commandNames = calls.map(c => c.args[0]);
    expect(commandNames).toEqual(["init", "remote", "fetch", "checkout"]);

    for (const call of calls) {
      expect(call.cwd).toBe(fakePath);
    }
  });
});