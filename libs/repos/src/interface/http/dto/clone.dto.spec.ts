import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CloneDto } from "./clone.dto";

const validateDto = async (payload: Partial<CloneDto>) => {
  const dto = plainToInstance(CloneDto, payload);
  return validate(dto);
};

describe("CloneDto validation", () => {
  it("accepts valid repoUrl and ref", async () => {
    const errors = await validateDto({ repoUrl: "https://github.com/user/repo.git", ref: "main" });
    expect(errors).toHaveLength(0);
  });

  it("rejects invalid repository URLs", async () => {
    const errors = await validateDto({ repoUrl: "http://", ref: "main" });
    expect(errors.some((err) => err.property === "repoUrl")).toBe(true);
  });

  it("rejects empty refs", async () => {
    const errors = await validateDto({ repoUrl: "https://example/git.git", ref: "" });
    expect(errors).not.toHaveLength(0);
    expect(errors.some((err) => err.property === "ref")).toBe(true);
  });
});
