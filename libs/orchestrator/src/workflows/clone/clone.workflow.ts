import { proxyActivities } from "@temporalio/workflow";
 import type { cloneInput, cloneResult } from "./clone.types.ts";

import * as activities from "./clone.activities";
const { resolveCommit, fetchSnapshot } = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minute", 
  retry: { 
     maximumAttempts: 3,
     initialInterval: "2s" 
  }
});


export async function cloneRepoWorkflow(
  input: cloneInput
): Promise<cloneResult> {

  console.log(`Starting workflow for ${input.repoUrl} @ ${input.ref}`);

  const sha = await resolveCommit(input.repoUrl, input.ref);

  console.log(`Resolved SHA: ${sha}`);

  const { path } = await fetchSnapshot(input.repoUrl, sha);

  console.log(`Snapshot fetched to: ${path}`);

  return { sha, path };
}