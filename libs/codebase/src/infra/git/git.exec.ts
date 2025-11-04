import { execFile, ExecFileException } from "node:child_process";


class ProcessError extends Error {
  code?: string | number | null; 
  stdout: string;
  stderr: string;

  constructor(message: string, code?: string | number | null, stdout = "", stderr = "") {
    super(message);
    this.name = "ProcessError";
    this.code = code;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

/**
 * @returns
 */
export function sh(
  cmd: string,
  args: string[] = [],
  cwd?: string,
  timeout = 60_000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    
    const child = execFile(cmd, args, { cwd, timeout }, (err: ExecFileException | null, stdout, stderr) => {
      if (err) {
        const e = new ProcessError(stderr || err.message, err.code, String(stdout), String(stderr));
        return reject(e);
      }
      resolve({ stdout: String(stdout), stderr: String(stderr) });
    });

    child.on("error", (e) => {
      reject(new ProcessError(`Failed to execute "${cmd}": ${e.message}`));
    });

    child.on("close", (code, signal) => {
      if (signal === "SIGTERM") {
        reject(new ProcessError(`Process timeout after ${timeout / 1000}s for command: ${cmd}`));
      }
    });
  });
}