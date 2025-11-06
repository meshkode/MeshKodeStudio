# CloneRepo@SHA

Workflow name: `CloneRepoWorkflow`
Task queue: `context-task-queue`

Input: `{ repoUrl, ref }`
Output: `{ sha, path }`

Run locally:
1. `docker compose up -d`
2. `pnpm nx serve temporal-worker`
3. Open Temporal Web at http://localhost:8088

Notes:
- Provider uses local git CLI
- Path is returned for local tests only