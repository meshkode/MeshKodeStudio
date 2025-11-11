import 'reflect-metadata';
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as temporalFactory from "@proj/orchestrator/src/temporal.client";
import { AppModule } from "../../app.module";

// Mock temporalClient factory for deterministic tests
const startCloneMock = jest.fn();
const getHandleMock = jest.fn();

jest.mock("@proj/orchestrator/src/temporal.client", () => {
  const original = jest.requireActual("@proj/orchestrator/src/temporal.client");
  return {
    ...original,
    temporalClient: jest.fn(async () => ({
      startClone: startCloneMock,
      getHandle: getHandleMock,
    })),
  };
});

describe("ReposController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /v1/repos/clone returns workflowId and started", async () => {
    startCloneMock.mockResolvedValueOnce({
      workflowId: "clone-123",
      result: jest.fn(),
      describe: jest.fn(),
    });

    await request(app.getHttpServer())
      .post("/v1/repos/clone")
      .send({ repoUrl: "https://example/repo.git", ref: "main" })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ workflowId: "clone-123", status: "started" });
      });
  });

  it("POST /v1/repos/clone validates body", async () => {
    await request(app.getHttpServer())
      .post("/v1/repos/clone")
      .send({ repoUrl: "not-a-url", ref: "" })
      .expect(400);
  });

  it("GET /v1/repos/clone/:id returns running", async () => {
    getHandleMock.mockReturnValueOnce({
      workflowId: "clone-123",
      result: jest.fn().mockRejectedValue(new Error("not ready")),
      describe: jest.fn().mockResolvedValue({ status: { name: "RUNNING" } }),
    });

    await request(app.getHttpServer())
      .get("/v1/repos/clone/clone-123")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ workflowId: "clone-123", status: "running" });
      });
  });

  it("GET /v1/repos/clone/:id returns completed with sha", async () => {
    getHandleMock.mockReturnValueOnce({
      workflowId: "clone-123",
      result: jest
        .fn()
        .mockResolvedValue({ sha: "deadbeef".repeat(5), path: "/tmp/repo" }),
      describe: jest.fn(),
    });

    await request(app.getHttpServer())
      .get("/v1/repos/clone/clone-123")
      .expect(200)
      .expect(({ body }) => {
        expect(body.workflowId).toBe("clone-123");
        expect(body.status).toBe("completed");
        expect(body.result.sha).toMatch(/^[0-9a-f]{40}$/);
        expect(body.result.path).toBeUndefined(); // path not exposed
      });
  });

  it("GET /v1/repos/clone/:id maps ref-not-found to 422", async () => {
    getHandleMock.mockReturnValueOnce({
      workflowId: "clone-404",
      result: jest
        .fn()
        .mockRejectedValue(new Error("ref not found: feature/x")),
      describe: jest.fn().mockResolvedValue({ status: { name: "FAILED" } }),
    });

    await request(app.getHttpServer())
      .get("/v1/repos/clone/clone-404")
      .expect(422)
      .expect(({ body }) => {
        expect(body.message).toBe("invalid ref");
      });
  });
});
