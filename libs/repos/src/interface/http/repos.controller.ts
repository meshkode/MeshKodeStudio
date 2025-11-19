import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, Param, Post } from "@nestjs/common";
import { TEMPORAL_CLIENT } from "@proj/orchestrator/src/temporal.module";
import { TemporalClientApi } from "@proj/orchestrator/src/temporal.client";
import { CloneDto } from "./dto/clone.dto";

@Controller("repos")
export class ReposController {
  constructor(@Inject(TEMPORAL_CLIENT) private readonly temporal: TemporalClientApi) {}

  private raiseTemporalUnavailable(error: unknown): void {
    const message = typeof (error as any)?.message === "string" ? (error as any).message : "";
    if (message === "temporal-unavailable") {
      throw new HttpException({ message: "temporal unavailable" }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Post("clone")
  @HttpCode(201)
  async startClone(@Body() dto: CloneDto) {
    try {
      const handle = await this.temporal.startClone({ repoUrl: dto.repoUrl, ref: dto.ref });
      return { workflowId: handle.workflowId, status: "started" as const };
    } catch (e: any) {
      this.raiseTemporalUnavailable(e);
      throw new HttpException({ message: "failed to start workflow", detail: e?.message ?? "unknown" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get("clone/:id")
  async getCloneStatus(@Param("id") id: string) {
    const handle = this.temporal.getHandle(id);

    try {
      const r = await handle.result({ followRuns: false });
      return { workflowId: id, status: "completed" as const, result: { sha: r.sha } };
    } catch (e: any) {
      this.raiseTemporalUnavailable(e);
      const desc = await handle
        .describe()
        .catch((err) => {
          this.raiseTemporalUnavailable(err);
          return null as any;
        });
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
