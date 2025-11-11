import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post } from "@nestjs/common";
import { temporalClient } from "@proj/orchestrator/src/temporal.client";
import { CloneDto } from "./dto/clone.dto";

@Controller("repos")
export class ReposController {
  @Post("clone")
  @HttpCode(201)
  async startClone(@Body() dto: CloneDto) {
    try {
      const client = await temporalClient();
      const handle = await client.startClone({ repoUrl: dto.repoUrl, ref: dto.ref });
      return { workflowId: handle.workflowId, status: "started" as const };
    } catch (e: any) {
      throw new HttpException({ message: "failed to start workflow", detail: e?.message ?? "unknown" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get("clone/:id")
  async getCloneStatus(@Param("id") id: string) {
    const client = await temporalClient();
    const handle = client.getHandle(id);

    try {
      const r = await handle.result({ followRuns: false });
      return { workflowId: id, status: "completed" as const, result: { sha: r.sha } };
    } catch (e: any) {
      const desc = await handle.describe().catch(() => null as any);
      if (desc?.status?.name === "RUNNING") {
        return { workflowId: id, status: "running" as const };
      }
      const msg = String(e?.message ?? "").toLowerCase();
      if (msg.includes("ref not found")) {
        throw new HttpException({ message: "invalid ref", error: e?.message ?? "ref not found" }, HttpStatus.UNPROCESSABLE_ENTITY);
      }
      throw new HttpException({ message: "workflow failed", error: e?.message ?? "unknown" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

