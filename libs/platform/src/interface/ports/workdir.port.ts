export interface WorkdirPort {
  mktemp(prefix: string): string;
}
export const WORKDIR_PORT = Symbol('WorkdirPort');