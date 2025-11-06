import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { cloneRepoWorkflow } from '../clone/clone.workflow';
import * as activities from '../clone/clone.activities';
import { createTestEnv } from '../../../../testing/src/temporal/test-env';

describe('CloneRepoWorkflow FULL integration', () => {
  jest.setTimeout(120_000);
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('successfully runs the full workflow and returns SHA + path', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'clone-test-full';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../clone/clone.workflow'),
      activities,
    });

    const result = await worker.runUntil(
      client.workflow.execute(cloneRepoWorkflow, {
        args: [
          {
            repoUrl: 'https://github.com/octocat/Hello-World.git',
            ref: 'master',
          },
        ],
        workflowId: `clone-full-${Date.now()}`,
        taskQueue,
      })
    );

    expect(result.sha).toBeDefined();
    expect(result.path).toBeDefined();
    expect(result.sha.length).toBe(40);
    console.log('✅ Full Workflow (Integration) result:', result);
  });
});

describe('CloneRepoWorkflow (Unit Test)', () => {
  let testEnv: TestWorkflowEnvironment;

  const mockActivities = {
    resolveCommit: jest.fn(),
    fetchSnapshot: jest.fn(),
  };

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('runs the workflow logic and calls activities in order (fast)', async () => {
    const { client } = testEnv;
    const taskQueue = 'clone-test-unit';

    mockActivities.resolveCommit.mockResolvedValue('fake-sha-from-mock-123');
    mockActivities.fetchSnapshot.mockResolvedValue({ path: '/tmp/fake-path-from-mock' });

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../clone/clone.workflow'),
      activities: mockActivities,
    });

    const result = await worker.runUntil(
      client.workflow.execute(cloneRepoWorkflow, {
        args: [
          {
            repoUrl: 'https://any.repo.com/fake.git',
            ref: 'main',
          },
        ],
        workflowId: `clone-unit-${Date.now()}`,
        taskQueue,
      })
    );

    expect(result.sha).toBe('fake-sha-from-mock-123');
    expect(result.path).toBe('/tmp/fake-path-from-mock');

    expect(mockActivities.resolveCommit).toHaveBeenCalledWith(
      'https://any.repo.com/fake.git',
      'main'
    );
    expect(mockActivities.fetchSnapshot).toHaveBeenCalledWith(
      'https://any.repo.com/fake.git',
      'fake-sha-from-mock-123'
    );
  });
});