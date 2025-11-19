import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpErrorFilter } from "@proj/http/src/http.exception.filter";
import { HttpValidationPipe } from "@proj/http/src/http.validation.pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(HttpValidationPipe);
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(parseInt(process.env.PORT ?? "3000", 10));
}
bootstrap();

