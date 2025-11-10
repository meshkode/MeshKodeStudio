import { MockActivityEnvironment } from "@temporalio/testing";
import * as activities from "../clone/clone.activities";

describe("Git Activities (Real Network)", () => {
  jest.setTimeout(60000);

  const env = new MockActivityEnvironment();

  const repoUrl = "https://github.com/octocat/Hello-World.git";
  const ref = "master";

  let realSha: string;

  test("1. resolveCommit successfully returns a SHA", async () => {
    const resultSha = (await env.run(
      activities.resolveCommit,
      repoUrl,
      ref
    )) as string;

    expect(resultSha).toBeDefined();
    expect(resultSha.length).toBe(40);

    console.log("✅ Activity (resolveCommit) result:", resultSha);
    realSha = resultSha;
  });

  test("2. fetchSnapshot successfully clones using the SHA", async () => {
    if (!realSha) {
      console.warn("Skipping fetchSnapshot test because SHA not available");
      return;
    }

    const result = (await env.run(
      activities.fetchSnapshot,
      repoUrl,
      realSha
    )) as { path: string };

    expect(result.path).toBeDefined();
    expect(result.path).toContain("repo-");

    console.log("✅ Activity (fetchSnapshot) result:", result.path);
  });
});
