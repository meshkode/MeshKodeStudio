import { HttpException } from "@nestjs/common";
import { ReposController } from "./repos.controller";
import { TemporalClientApi, TemporalCloneHandle } from "@proj/orchestrator/src/temporal.client";

const createHandle = (overrides: Partial<TemporalCloneHandle> = {}): TemporalCloneHandle => ({
  workflowId: "clone-123",
  result: jest.fn(),
  describe: jest.fn(),
  ...overrides,
});

describe("ReposController (unit)", () => {
  let temporal: jest.Mocked<TemporalClientApi>;
  let controller: ReposController;

  beforeEach(() => {
    temporal = {
      startClone: jest.fn(),
      getHandle: jest.fn(),
    };
    controller = new ReposController(temporal);
  });

  describe("startClone", () => {
    it("delegates to temporal client and returns workflowId", async () => {
      temporal.startClone.mockResolvedValue(createHandle({ workflowId: "clone-uuid" }));

      const response = await controller.startClone({ repoUrl: "https://example/repo.git", ref: "main" });

      expect(temporal.startClone).toHaveBeenCalledWith({ repoUrl: "https://example/repo.git", ref: "main" });
      expect(response).toEqual({ workflowId: "clone-uuid", status: "started" });
    });

    it("throws 503 when temporal client is unavailable", async () => {
      temporal.startClone.mockRejectedValue(new Error("temporal-unavailable"));

      await expect(controller.startClone({ repoUrl: "https://x/y.git", ref: "main" })).rejects.toMatchObject({
        status: 503,
        response: { message: "temporal unavailable" },
      });
    });
  });

  describe("getCloneStatus", () => {
    it("returns completed result when workflow finished", async () => {
      const handle = createHandle({
        result: jest.fn().mockResolvedValue({ sha: "deadbeef".repeat(5), path: "/tmp" }),
      });
      temporal.getHandle.mockReturnValue(handle);

      const resp = await controller.getCloneStatus("clone-abc");

      expect(handle.result).toHaveBeenCalledWith({ followRuns: false });
      expect(resp).toEqual({ workflowId: "clone-abc", status: "completed", result: { sha: "deadbeef".repeat(5) } });
    });

    it("returns running status when describe reports RUNNING", async () => {
      const handle = createHandle({
        result: jest.fn().mockRejectedValue(new Error("not ready")),
        describe: jest.fn().mockResolvedValue({ status: { name: "RUNNING" } }),
      });
      temporal.getHandle.mockReturnValue(handle);

      const resp = await controller.getCloneStatus("clone-abc");

      expect(resp).toEqual({ workflowId: "clone-abc", status: "running" });
    });

    it("maps ref not found errors to 422", async () => {
      const handle = createHandle({
        result: jest.fn().mockRejectedValue(new Error("Ref not found: origin/main")),
        describe: jest.fn().mockResolvedValue({ status: { name: "FAILED" } }),
      });
      temporal.getHandle.mockReturnValue(handle);

      await expect(controller.getCloneStatus("clone-abc")).rejects.toMatchObject({
        status: 422,
        response: { message: "invalid ref" },
      });
    });

    it("propagates workflow failures as HTTP 500", async () => {
      const handle = createHandle({
        result: jest.fn().mockRejectedValue(new Error("boom")),
        describe: jest.fn().mockResolvedValue({ status: { name: "FAILED" } }),
      });
      temporal.getHandle.mockReturnValue(handle);

      await expect(controller.getCloneStatus("clone-abc")).rejects.toMatchObject({ status: 500 });
    });

    it("throws 503 when temporal client is unavailable in result", async () => {
      const handle = createHandle({
        result: jest.fn().mockRejectedValue(new Error("temporal-unavailable")),
        describe: jest.fn(),
      });
      temporal.getHandle.mockReturnValue(handle);

      await expect(controller.getCloneStatus("clone-abc")).rejects.toMatchObject({
        status: 503,
        response: { message: "temporal unavailable" },
      });
    });
  });
});
