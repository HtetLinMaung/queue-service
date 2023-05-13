import { log } from "console";
import { setupConnections } from "./utils/setup-connections";

export const afterWorkerStart = async () => {
  log("after worker started");
  await setupConnections();
};
