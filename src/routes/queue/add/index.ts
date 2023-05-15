import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import { log } from "starless-logger";
import {
  getConn,
  getConsumer,
  getProducer,
} from "../../../utils/setup-connections";

export default brewBlankExpressFunc(async (req, res) => {
  const { API_KEY, MQ_TYPE } = process.env;
  const userApiKey = req.get("X-API-Key");

  if (!userApiKey || userApiKey !== API_KEY) {
    throwErrorResponse(401, "Unauthorized");
  }

  const { message, queue } = req.body;

  if (MQ_TYPE === "rabbitmq") {
    const conn = getConn();
    const ch = await conn.createChannel();
    await ch.assertQueue(queue, { durable: true });
    await ch.sendToQueue(queue, Buffer.from(message), { persistent: true });
    log(` [x] Sent '${message}'`);

    res.json({
      code: 200,
      message: "Message sent to RabbitMQ!",
    });
  } else if (MQ_TYPE === "kafka") {
    const producer = getProducer();
    await producer.connect();
    await producer.send({
      topic: queue,
      messages: [{ value: message }],
    });
    log(` [x] Sent '${message}'`);

    const consumer = getConsumer();
    await consumer.connect();
    await consumer.subscribe({ topic: queue });

    res.json({
      code: 200,
      message: "Message sent to Kafka!",
    });
  } else {
    throwErrorResponse(
      400,
      "Invalid MQ_TYPE environment variable. It should be either 'rabbitmq' or 'kafka'."
    );
  }
});
