import { log } from "console";
import { setupConnections } from "./utils/setup-connections";
import startConsumer from "./utils/start-consumer";
import config from "config";

export const afterWorkerStart = async () => {
  log("after worker started");
  await setupConnections();
  const { MQ_TYPE, REQUEUE_DELAY } = process.env;
  const queueApiMapping: any = config.get("queueApiMapping");
  for (const queue in queueApiMapping) {
    await startConsumer(queue, queueApiMapping, MQ_TYPE, REQUEUE_DELAY);
  }
};
