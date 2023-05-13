import amqp from "amqplib";
import { Consumer, Kafka, Producer } from "kafkajs";

let ch: any;
let conn: amqp.Connection;
let producer: Producer;
let consumer: Consumer;

export const getCh = () => {
  return ch;
};

export const getConn = () => {
  return conn;
};

export const getProducer = () => {
  return producer;
};

export const getConsumer = () => {
  return consumer;
};

// Setup connections at startup
export async function setupConnections() {
  const { MQ_CONNECTION, MQ_TYPE, KAFKA_BROKERS } = process.env;

  if (MQ_TYPE === "rabbitmq") {
    conn = await amqp.connect(MQ_CONNECTION);
    ch = await conn.createChannel();
  } else if (MQ_TYPE === "kafka") {
    const kafka = new Kafka({
      clientId: "queue-service",
      brokers: KAFKA_BROKERS.split(","),
    });
    producer = kafka.producer();
    await producer.connect();
    consumer = kafka.consumer({ groupId: "my-group" });
    await consumer.connect();
  } else {
    throw new Error(
      'Invalid MQ_TYPE environment variable. It should be either "rabbitmq" or "kafka".'
    );
  }
}
