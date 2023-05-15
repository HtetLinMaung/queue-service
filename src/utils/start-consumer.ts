import { getConn, getConsumer } from "./setup-connections";
import httpClient from "starless-http";

// Create a function to start a consumer
export default async function startConsumer(
  queue: string,
  queueApiMapping: any,
  MQ_TYPE: string,
  REQUEUE_DELAY: string
) {
  if (MQ_TYPE === "rabbitmq") {
    const conn = getConn();
    const ch = await conn.createChannel();
    await ch.assertQueue(queue, { durable: true });

    ch.consume(queue, async (msg) => {
      const message = msg.content.toString();
      const apiEndpoint = queueApiMapping[queue];
      const [response, err] = await httpClient.post(apiEndpoint, { message });
      if (!err && response.status < 400) {
        ch.ack(msg);
      } else {
        if (REQUEUE_DELAY) {
          setTimeout(() => ch.nack(msg, false, true), parseInt(REQUEUE_DELAY));
        } else {
          ch.nack(msg, false, true);
        }
      }
    });
  } else if (MQ_TYPE === "kafka") {
    const consumer = getConsumer();
    await consumer.connect();
    await consumer.subscribe({ topic: queue });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const apiEndpoint = queueApiMapping[topic];
        const [response, err] = await httpClient.post(apiEndpoint, {
          message: message.value.toString(),
        });
        if (err || response.status >= 400) {
          if (REQUEUE_DELAY) {
            setTimeout(
              () => consumer.seek({ topic, partition, offset: message.offset }),
              parseInt(REQUEUE_DELAY)
            );
          } else {
            consumer.seek({ topic, partition, offset: message.offset });
          }
        }
      },
    });
  }
}
