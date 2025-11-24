import { NativeConnection, Worker } from "@temporalio/worker";
import { join } from "node:path";
import * as activities from "@libs/orchestrator/src/workflows/clone/clone.activities";

async function bootstrap() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "context-task-queue";

  const connection = await NativeConnection.connect({ address: temporalAddress });

  const workflowsPath = join(
    process.cwd(),
    "libs",
    "orchestrator",
    "src",
    "workflows",
    "clone",
    "clone.workflow.ts"
  );

  const worker = await Worker.create({
    connection,
    taskQueue,
    workflowsPath,
    activities,
  });

  console.log(`✅ Worker connected to Temporal at: ${temporalAddress}`);
  console.log(`📦 Listening on task queue: ${taskQueue}`);

  await worker.run();
}

bootstrap().catch((e) => {
  console.error("❌ Error running worker:", e);
  process.exit(1);
});
