import { Module } from "@nestjs/common";
import { ReposController } from "@proj/repos/src/interface/http/repos.controller";

@Module({
  controllers: [ReposController],
  exports: [],
})
export class HttpModule {}

