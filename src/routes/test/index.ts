import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import { log } from "starless-logger";

export default brewBlankExpressFunc(async (req, res) => {
  log(`calling test api with ${req.body.message}`);
  throwErrorResponse(500, "intentionally failed");
  res.json({
    code: 200,
    message: "success",
  });
});
