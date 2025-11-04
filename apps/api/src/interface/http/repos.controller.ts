import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post } from "@nestjs/common";
import { CloneDto } from "./dto/clone.dto";
import { temporalClient } from "../../infra/temporal/temporal.client";

@Controller("repos")
export class ReposController {
  /**
   * Start the clone workflow. Returns a workflowId and started status.
   */
  @Post("clone")
  @HttpCode(201)
  async startClone(@Body() dto: CloneDto) {
    try {
      const client = await temporalClient();
      const handle = await client.startClone({ repoUrl: dto.repoUrl, ref: dto.ref });
      return { workflowId: handle.workflowId, status: "started" as const };
    } catch (e: any) {
      // Invalid input to Temporal or connection errors
      throw new HttpException({ message: "failed to start workflow", detail: e?.message ?? "unknown" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Poll the clone workflow by id.
   * Running: { workflowId, status: "running" }
   * Completed: { workflowId, status: "completed", result: { sha } }
   * Failed: { workflowId, status: "failed", error }
   */
  @Get("clone/:id")
  async getCloneStatus(@Param("id") id: string) {
    const client = await temporalClient();
    const handle = client.getHandle(id);

    try {
      const r = await handle.result({ followRuns: false });
      // Do not leak local path to public callers
      return { workflowId: id, status: "completed" as const, result: { sha: r.sha } };
    } catch (e: any) {
      // Check if still running
      const desc = await handle.describe().catch(() => null as any);
      if (desc && desc.status && desc.status.name === "RUNNING") {
        return { workflowId: id, status: "running" as const };
      }

      // Map common domain error "ref not found" to 422
      const msg = String(e?.message ?? "").toLowerCase();
      if (msg.includes("ref not found")) {
        throw new HttpException({ message: "invalid ref", error: e?.message ?? "ref not found" }, HttpStatus.UNPROCESSABLE_ENTITY);
      }
      throw new HttpException({ message: "workflow failed", error: e?.message ?? "unknown" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}