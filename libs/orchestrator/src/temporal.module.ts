import { Global, Module } from "@nestjs/common";
import { temporalClient, TemporalClientApi, TemporalCloneHandle } from "./temporal.client";

export const TEMPORAL_CLIENT = Symbol("TEMPORAL_CLIENT");

function createHandleProxy(getClient: () => Promise<TemporalClientApi>, id: string): TemporalCloneHandle {
  let handlePromise: Promise<TemporalCloneHandle> | null = null;

  const getHandle = async () => {
    if (!handlePromise) {
      handlePromise = getClient().then((client) => client.getHandle(id));
    }
    return handlePromise;
  };

  return {
    workflowId: id,
    result: async (opts) => {
      const handle = await getHandle();
      return handle.result(opts);
    },
    describe: async () => {
      const handle = await getHandle();
      return handle.describe();
    },
  };
}

function lazyTemporalClient(): TemporalClientApi {
  let clientPromise: Promise<TemporalClientApi> | null = null;

  const getClient = async () => {
    if (!clientPromise) {
      clientPromise = temporalClient().catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  };

  return {
    async startClone(input) {
      const client = await getClient();
      return client.startClone(input);
    },
    getHandle(id: string) {
      return createHandleProxy(getClient, id);
    },
  };
}

@Global()
@Module({
  providers: [
    {
      provide: TEMPORAL_CLIENT,
      useFactory: lazyTemporalClient,
    },
  ],
  exports: [TEMPORAL_CLIENT],
})
export class OrchestratorTemporalModule {}

export type { TemporalClientApi } from "./temporal.client";
