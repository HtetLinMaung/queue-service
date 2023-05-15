import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import { log } from "starless-logger";

export default brewBlankExpressFunc(async (req, res) => {
  log(`calling test api with ${req.body.message}`);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 10000);
  });
  res.json({
    code: 200,
    message: "success",
  });
});
