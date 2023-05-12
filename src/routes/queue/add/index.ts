import { brewBlankExpressFunc, throwErrorResponse } from "code-alchemy";
import amqp from "amqplib";
import { log } from "starless-logger";
import { Kafka } from "kafkajs";
import config from "config";
import httpClient from "starless-http";

export default brewBlankExpressFunc(async (req, res) => {
  const { message, queue } = req.body;
  const { MQ_CONNECTION, MQ_TYPE, KAFKA_BROKERS } = process.env;
  const queueApiMapping: any = config.get("queueApiMapping");

  if (MQ_TYPE === "rabbitmq") {
    const conn = await amqp.connect(MQ_CONNECTION);
    const ch = await conn.createChannel();
    await ch.assertQueue(queue, { durable: false });
    await ch.sendToQueue(queue, Buffer.from(message));
    log(` [x] Sent '${message}'`);

    ch.consume(queue, async (msg) => {
      const message = msg.content.toString();
      const apiEndpoint = queueApiMapping[queue];
      await httpClient.post(apiEndpoint, { message });
      ch.ack(msg);
    });

    res.json({
      code: 200,
      message: "Message sent to RabbitMQ!",
    });
  } else if (MQ_TYPE === "kafka") {
    const kafka = new Kafka({
      clientId: "queue-service",
      brokers: KAFKA_BROKERS.split(","),
    });
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: queue,
      messages: [{ value: message }],
    });
    log(` [x] Sent '${message}'`);

    const consumer = kafka.consumer({ groupId: "my-group" });
    await consumer.connect();
    await consumer.subscribe({ topic: queue });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const apiEndpoint = queueApiMapping[topic];
        await httpClient.post(apiEndpoint, {
          message: message.value.toString(),
        });
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
