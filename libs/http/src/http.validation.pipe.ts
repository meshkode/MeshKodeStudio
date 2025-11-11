import { ValidationPipe } from "@nestjs/common";

export const HttpValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

