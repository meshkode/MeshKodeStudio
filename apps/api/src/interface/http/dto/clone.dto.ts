import { IsString, IsUrl, MinLength } from "class-validator";

export class CloneDto {
  @IsUrl({ require_tld: false }) // allow localhost or intranet hosts
  repoUrl!: string;

  @IsString()
  @MinLength(1)
  ref!: string; // branch | tag | sha
}