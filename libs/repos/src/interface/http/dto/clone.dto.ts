import { IsString, IsUrl, MinLength } from "class-validator";
export class CloneDto {
  @IsUrl({ require_tld: false }) repoUrl!: string;
  @IsString() @MinLength(1) ref!: string;
}

