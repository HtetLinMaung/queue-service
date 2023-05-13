import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import { log } from "starless-logger";
import config from "config";
import httpClient from "starless-http";
import {
  getConn,
  getConsumer,
  getProducer,
} from "../../../utils/setup-connections";

export default brewBlankExpressFunc(async (req, res) => {
  const { API_KEY } = process.env;
  const userApiKey = req.get("X-API-Key");

  if (!userApiKey || userApiKey !== API_KEY) {
    throwErrorResponse(401, "Unauthorized");
  }

  const { message, queue } = req.body;
  const { MQ_TYPE } = process.env;
  const queueApiMapping: any = config.get("queueApiMapping");

  if (MQ_TYPE === "rabbitmq") {
    const conn = getConn();
    const ch = await conn.createChannel();
    await ch.assertQueue(queue, { durable: false });
    await ch.sendToQueue(queue, Buffer.from(message));
    log(` [x] Sent '${message}'`);

    ch.consume(queue, async (msg) => {
      const message = msg.content.toString();
      const apiEndpoint = queueApiMapping[queue];
      const [_, err] = await httpClient.post(
        apiEndpoint,
        { message },
        {},
        {
          retry: 99999,
          retryDelay: 3000,
          retryWhen: (res) => !res || res.status >= 400,
        }
      );
      if (!err) {
        ch.ack(msg);
      }
    });

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

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const apiEndpoint = queueApiMapping[topic];
        await httpClient.post(
          apiEndpoint,
          {
            message: message.value.toString(),
          },
          {},
          {
            retry: 99999,
            retryDelay: 3000,
            retryWhen: (res) => !res || res.status >= 400,
          }
        );
      },
    });

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
