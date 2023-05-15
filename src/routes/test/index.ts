import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import { log } from "starless-logger";

export default brewBlankExpressFunc(async (req, res) => {
  log(`calling test api with ${req.body.message}`);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 10000);
  });
  log(`finished processing`);
  res.json({
    code: 200,
    message: "success",
  });
});
