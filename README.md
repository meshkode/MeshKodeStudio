# Git Repository Cloning Service

A scalable, fault-tolerant service for cloning Git repositories using **Temporal Workflows** and **NestJS**. This project follows the **Hexagonal Architecture (Ports and Adapters)** pattern to ensure separation of concerns and testability.

## � What It Does (Simple Explanation)

In simple terms, this project is an API that lets you clone Git repositories in the background. You give it a URL (like a GitHub repo), and it handles the cloning process reliably, even retrying if something goes wrong. It's designed to handle many clone requests at once without crashing.

## �🚀 Features

- **Asynchronous Cloning**: Handles long-running clone operations reliably using Temporal workflows.
- **Fault Tolerance**: Automatically retries failed operations (e.g., network glitches) with exponential backoff.
- **Scalable Architecture**: Separates the API (HTTP layer) from the Worker (execution layer).
- **Hexagonal Architecture**: Core domain logic is isolated from infrastructure concerns (Git CLI, File System).
- **Type-Safe**: Built with TypeScript and Nx for robust monorepo management.

## 🏗️ Architecture

The project is structured as an **Nx Monorepo** with the following libraries and applications:

### Applications (`apps/`)

- **`api`**: A NestJS REST API that acts as the entry point. It receives HTTP requests and starts Temporal workflows.
- **`temporal-worker`**: A dedicated worker application that listens to the Temporal task queue and executes workflows and activities.

### Libraries (`libs/`)

- **`platform`**: Contains the core **Ports** (interfaces) and domain entities. This layer is pure and has no external dependencies.
- **`platform-infra`**: Contains the **Adapters** (implementations) for the ports, such as the Git CLI wrapper and File System services.
- **`orchestrator`**: Contains the **Temporal Workflows** and Activities definitions.
- **`repos`**: Domain logic specific to repository management.
- **`shared-kernel`**: Shared utilities, types, and constants used across the system.

## 🛠️ Tech Stack

- **Orchestration**: [Temporal.io](https://temporal.io/)
- **Framework**: [NestJS](https://nestjs.com/)
- **Monorepo Tool**: [Nx](https://nx.dev/)
- **Language**: TypeScript
- **Infrastructure**: Git CLI, Docker (for Temporal server)

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+)
- **pnpm** (or npm/yarn)
- **Docker** & **Docker Compose** (for running Temporal server)
- **Temporal CLI** (optional, for local development)

## ⚙️ Setup & Installation

1. **Clone the repository**:

   ```bash
   git clone <repo-url>
   cd <repo-name>
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

## 🏃‍♂️ Running the Application

You need to run the following processes to have the full system working.

### 1. Start Infrastructure (Docker)

Start the required services (Postgres, Temporal) using Docker Compose.

```bash
docker compose up -d
```

### 2. Start the API

The API accepts HTTP requests and triggers workflows.

```bash
npx nx serve api
```

_The API will be available at http://localhost:3000_

> **Note**: If port 3000 is in use, you can change it by setting the `PORT` environment variable: `PORT=3001 npx nx serve api`

### 3. Start Temporal Server (Dev Mode)

If you are not using the Docker-based Temporal server, you can start the dev server using the CLI.

```bash
temporal server start-dev
```

_The UI will be available at http://localhost:8233_

### 4. Start the Worker

The worker executes the actual workflows and activities.

```bash
npx nx serve temporal-worker
```
> **Note**: You can send requests to the worker using the Temporal CLI.
```bash
temporal workflow start --task-queue context-task-queue --type cloneRepoWorkflow --workflow-id test-1 --input '{"repoUrl": "https://github.com/octocat/Hello-World.git", "ref": "master"}'
```

## 🔌 API Usage

### Clone a Repository

**POST** `/v1/repos/clone`

Request Body:

```json
{
  "repoUrl": "https://github.com/octocat/Hello-World.git",
  "ref": "master"
}
```

Response:

```json
{
  "workflowId": "clone-uuid-123",
  "status": "RUNNING"
}
```

### Get Clone Status & Result

**GET** `/v1/repos/clone/:id`

Replace `:id` with the `workflowId` returned from the clone request.

Response (Success):

```json
{
  "status": "COMPLETED",
  "result": {
    "sha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
    "path": "/tmp/repo-XXXXXX"
  }
}
```

## 🧪 Running Tests

Run unit tests for specific projects:

```bash
# Run tests for the orchestrator (workflows)
npx nx test orchestrator

# Run tests for the infrastructure layer
npx nx test platform-infra

# Run all tests
npx nx run-many --target=test --all
```

## 📂 Project Structure

```
├── apps/
│   ├── api/                 # NestJS REST API
│   └── temporal-worker/     # Temporal Worker
├── libs/
│   ├── orchestrator/        # Workflows & Activities
│   ├── platform/            # Domain Interfaces (Ports)
│   ├── platform-infra/      # Implementations (Adapters)
│   ├── repos/               # Repository Domain Logic
│   └── shared-kernel/       # Shared Utilities
├── nx.json                  # Nx Configuration
└── package.json             # Dependencies
```
