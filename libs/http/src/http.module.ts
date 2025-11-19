import { Module } from "@nestjs/common";
import { OrchestratorTemporalModule } from "@proj/orchestrator/src/temporal.module";
import { ReposController } from "@proj/repos";

@Module({
  imports: [OrchestratorTemporalModule],
  controllers: [ReposController],
  exports: [],
})
export class HttpModule {}
