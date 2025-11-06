import { TestWorkflowEnvironment } from "@temporalio/testing";

/**
 * Creates a time-skipping TestWorkflowEnvironment for unit tests.
 */
export async function createTestEnv() {
  return await TestWorkflowEnvironment.createTimeSkipping();
}