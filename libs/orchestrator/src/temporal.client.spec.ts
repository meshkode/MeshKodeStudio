import { temporalClient } from "./temporal.client";
import { Connection, Client } from "@temporalio/client";

jest.mock("@temporalio/client", () => {
  const workflowStartMock = jest.fn();
  const workflowGetHandleMock = jest.fn();
  const mockClientInstance = {
    workflow: {
      start: workflowStartMock,
      getHandle: workflowGetHandleMock,
    },
  };
  const ClientMock = jest.fn().mockImplementation(() => mockClientInstance);
  (ClientMock as any).__workflowStartMock = workflowStartMock;
  (ClientMock as any).__workflowGetHandleMock = workflowGetHandleMock;
  return {
    Connection: { connect: jest.fn() },
    Client: ClientMock,
  };
});

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "uuid-123"),
}));

const connectMock = Connection.connect as jest.MockedFunction<typeof Connection.connect>;
const workflowStartMock = (Client as any).__workflowStartMock as jest.Mock;
const workflowGetHandleMock = (Client as any).__workflowGetHandleMock as jest.Mock;

const createWorkflowHandle = () => ({
  workflowId: "clone-random-id",
  result: jest.fn(),
  describe: jest.fn(),
});

describe("temporalClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectMock.mockResolvedValue({} as any);
    delete process.env.TEMPORAL_ADDRESS;
    delete process.env.TEMPORAL_TASK_QUEUE;
  });

  it("connects to default address and starts CloneRepoWorkflow", async () => {
    const workflowHandle = createWorkflowHandle();
    workflowStartMock.mockResolvedValue(workflowHandle);

    const client = await temporalClient();
    const handle = await client.startClone({ repoUrl: "https://example/repo.git", ref: "main" });

    expect(connectMock).toHaveBeenCalledWith({ address: "localhost:7233" });
    expect(workflowStartMock).toHaveBeenCalledWith(
      "CloneRepoWorkflow",
      expect.objectContaining({
        taskQueue: "context-task-queue",
        workflowId: "clone-uuid-123",
        args: [{ repoUrl: "https://example/repo.git", ref: "main" }],
      })
    );
    expect(handle.workflowId).toBe("clone-random-id");
  });

  it("respects TEMPORAL env overrides", async () => {
    process.env.TEMPORAL_ADDRESS = "temporal:7234";
    process.env.TEMPORAL_TASK_QUEUE = "custom-queue";
    const workflowHandle = createWorkflowHandle();
    workflowStartMock.mockResolvedValue(workflowHandle);

    const client = await temporalClient();
    await client.startClone({ repoUrl: "https://example/repo.git", ref: "dev" });

    expect(connectMock).toHaveBeenCalledWith({ address: "temporal:7234" });
    expect(workflowStartMock).toHaveBeenCalledWith(
      "CloneRepoWorkflow",
      expect.objectContaining({ taskQueue: "custom-queue" })
    );
  });

  it("wraps workflow handles for getHandle", async () => {
    const workflowHandle = createWorkflowHandle();
    workflowGetHandleMock.mockReturnValue(workflowHandle);

    const client = await temporalClient();
    const handle = client.getHandle("clone-1");
    await handle.result({ followRuns: false });

    expect(workflowGetHandleMock).toHaveBeenCalledWith("clone-1");
    expect(workflowHandle.result).toHaveBeenCalledWith({ followRuns: false });
  });

  it("throws sentinel error when connection fails", async () => {
    connectMock.mockRejectedValueOnce(new Error("offline"));

    await expect(temporalClient()).rejects.toThrow("temporal-unavailable");
  });
});
