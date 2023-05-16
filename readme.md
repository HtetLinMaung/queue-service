# Queue Service Documentation

## Introduction

The Queue Service is a microservice that facilitates sending messages to RabbitMQ or Kafka message brokers. The service is highly configurable and can be adjusted to suit the needs of your specific environment. The service is built using Node.js and can be deployed using Docker.

## Service Configuration

The service is configurable through environment variables:

- `MQ_CONNECTION`: The URL of the RabbitMQ server.
- `MQ_TYPE`: The type of message queue, either 'rabbitmq' or 'kafka'.
- `API_KEY`: The API Key for authenticating to the service.
- `REQUEUE_DELAY`: The delay (in ms) before a failed message is requeued.
- `PREFETCH_COUNT`: The number of messages to prefetch from the queue (RabbitMQ only).
- `KAFKA_BROKERS`: A comma-separated list of Kafka brokers.

Example:

```yml
version: "3.9"

services:
  queue-service:
    image: htetlinmaung/queue-service:latest
    environment:
      - express_handler_mode=native
      - MQ_CONNECTION=amqp://rabbitmq:5672
      - MQ_TYPE=rabbitmq
      - API_KEY=91ff1415fc894d5e
      - REQUEUE_DELAY=0
      - PREFETCH_COUNT=1
      - KAFKA_BROKERS=kafka:9092
    volumes:
      - ./config:/app/config
```

## Message Queue Mapping

The service reads a mapping of queue names to API endpoints from a configuration file. This mapping is used to determine where to send messages when they are received from the queue. The configuration is stored in a `default.json` file in the `config` directory.

Example `default.json`:

```json
{
  "queueApiMapping": {
    "tasks": "http://localhost:3000/test"
  }
}
```

In the example above, messages from `the 'tasks' queue will be sent to http://localhost:3000/test`.

## Queue Consumer

When the service starts up, it creates a consumer for each queue specified in the queueApiMapping configuration. This consumer is responsible for receiving messages from the queue, sending them to the appropriate API endpoint, and handling any delivery failures.

In the case of RabbitMQ, the consumer will also respect the PREFETCH_COUNT setting, which determines the number of messages that the consumer will prefetch from the queue.

For Kafka, the consumer does not prefetch messages, but it will re-attempt to consume a message if an error occurs during processing.

## API Endpoints

The service exposes a single API endpoint, `/queue/add`, which is used to add messages to a queue. This endpoint requires the `X-API-Key` header to be set, and it expects a JSON body with the following structure:

```json
{
  "message": "Your message here",
  "queue": "The name of the queue"
}
```

Upon receiving a request, the service will add the specified message to the specified queue, and return a JSON response with the status of the operation. If successful, the response will look like this:

```json
{
  "code": 200,
  "message": "Message sent to RabbitMQ!"
}
```

Or for Kafka:

```json
{
  "code": 200,
  "message": "Message sent to Kafka!"
}
```

If an error occurs, the service will return an appropriate error message and status code.

## Error Handling

In the case of an error, the service will return an HTTP status code along with an error message. For instance, if the `MQ_TYPE` environment variable is not set to either 'rabbitmq' or 'kafka', you will receive a `400` status code with the following response:

```json
{
  "code": 400,
  "message": "Invalid MQ_TYPE environment variable. It should be either 'rabbitmq' or 'kafka'."
}
```

Similarly, if the `X-API-Key` header is not provided or does not match the `API_KEY` environment variable, you will receive a `401` status code with the following response:

```json
{
  "code": 401,
  "message": "Unauthorized"
}
```

## Docker and Docker Compose

The service is designed to be run in a Docker container, and it can be easily integrated into a Docker Compose setup. A sample Docker Compose configuration is provided above.

You can mount the `config` directory as a volume in the Docker container to provide the queue to API endpoint mapping.

## Conclusion

This microservice is designed to be simple to use and highly configurable, providing a powerful tool for managing message queues in a microservice architecture. Whether you're using RabbitMQ or Kafka, this service provides a unified API for adding messages to the queue and consuming them in an efficient and reliable way.
