import { Connection, WorkflowClient } from "@temporalio/client";

async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });

  const client = new WorkflowClient({ connection });

  const handle = await client.start("cloneRepoWorkflow", {
    args: [
      {
        repoUrl: "https://github.com/temporalio/samples-typescript.git",
        ref: "main",
      },
    ],
    taskQueue: "context-task-queue",
    workflowId: "clone-repo-demo-1",
  });

  console.log(`✅ Started workflow ${handle.workflowId}`);
  console.log(`👉 Run ID: ${handle.firstExecutionRunId}`);

  const result = await handle.result();
  console.log("🎯 Workflow result:", result);
}

run().catch((err) => {
  console.error("❌ Error starting workflow:", err);
  process.exit(1);
});
