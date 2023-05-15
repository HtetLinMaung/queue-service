import { log } from "console";
import { setupConnections } from "./utils/setup-connections";
import startConsumer from "./utils/start-consumer";
import config from "config";

export const afterWorkerStart = async () => {
  log("after worker started");
  await setupConnections();
  const { MQ_TYPE, REQUEUE_DELAY, PREFETCH_COUNT } = process.env;
  const queueApiMapping: any = config.get("queueApiMapping");

  for (const queue in queueApiMapping) {
    let consumerCount =
      typeof queueApiMapping[queue] == "object" &&
      queueApiMapping[queue].consumerCount
        ? queueApiMapping[queue].consumerCount
        : 1;

    for (let i = 0; i < consumerCount; i++) {
      await startConsumer(
        queue,
        queueApiMapping,
        MQ_TYPE,
        REQUEUE_DELAY,
        PREFETCH_COUNT
      );
    }
  }
};
