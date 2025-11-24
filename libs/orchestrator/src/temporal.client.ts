import { Client, Connection } from "@temporalio/client";
import { randomUUID } from "crypto";

export type CloneStartArgs = { repoUrl: string; ref: string };
export interface CloneResult {
  sha: string;
  path: string;
}

export interface TemporalCloneHandle {
  workflowId: string;
  result: (opts?: { followRuns?: boolean }) => Promise<CloneResult>;
  describe: () => Promise<{ status: { name: string } }>;
}

export interface TemporalClientApi {
  startClone(input: CloneStartArgs): Promise<TemporalCloneHandle>;
  getHandle(id: string): TemporalCloneHandle;
}

// Plain factory for easy mocking
export async function temporalClient(): Promise<TemporalClientApi> {
  const address = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "context-task-queue";

  let connection;
  try {
    connection = await Connection.connect({ address });
  } catch (e) {
    throw new Error("temporal-unavailable");
  }

  const client = new Client({ connection });

  return {
    async startClone(input: CloneStartArgs) {
      const handle = await client.workflow.start("CloneRepoWorkflow", {
        taskQueue,
        workflowId: `clone-${randomUUID()}`,
        args: [input],
      });

      return {
        workflowId: handle.workflowId,
        // Temporal 1.13 type defs don't yet expose the optional WorkflowResultOptions argument.
        // @ts-expect-error forwarding followRuns flag until upstream types catch up
        result: (opts) => handle.result(opts),
        describe: () => handle.describe(),
      };
    },

    getHandle(id: string) {
      const handle = client.workflow.getHandle(id);
      return {
        workflowId: id,
        // Temporal 1.13 type defs don't yet expose the optional WorkflowResultOptions argument.
        // @ts-expect-error forwarding followRuns flag until upstream types catch up
        result: (opts) => handle.result(opts),
        describe: () => handle.describe(),
      };
    },
  };
}
