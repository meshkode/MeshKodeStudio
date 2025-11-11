import { Module } from '@nestjs/common';
import { HttpModule } from '@proj/http/src/http.module';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
