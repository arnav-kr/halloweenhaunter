import Fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { db, registerHandlers, bulkSend, isValidId, createBatch, isActiveUser, isUnsubscribed, subscribeUser } from "./slack.js";
await registerHandlers();


const fastify = Fastify({
  logger: true,
});

await fastify.register(import("@fastify/rate-limit"), {
  global: false,
  allowList: ["127.0.0.1", "::1"],
});

await fastify.register(import("@fastify/cors"), {
  origin: false,
  methods: ["GET", "POST"],
});

await fastify.register(import("@fastify/static"), {
  root: path.join(__dirname, "public"),
});

fastify.post("/api/haunt", {
  config: {
    rateLimit: {
      max: 6,
      timeWindow: "1 minute",
    },
    schema: {
      body: {
        type: "object",
        required: ["slack_id"],
        properties: {
          slack_id: { type: "string" },
        },
      },
    },
  },
}, async (req) => {
  let { slack_id } = req.body;
  slack_id = slack_id.trim().toUpperCase();
  if (!(await isValidId(slack_id))) return { code: 404, data: "Invalid Slack ID" };
  if (!isUnsubscribed(slack_id) && !isActiveUser(slack_id)) subscribeUser(slack_id);
  console.log(createBatch(10));
  await bulkSend(createBatch(10), "Arnav Kumar:")
  fastify.log.info(`Slack ID: ${slack_id}`);
  return { data: "success", code: 200 };
});

fastify.listen({ port: process.env.FASTIFY_PORT || process.env.PORT || 3000 }, err => {
  if (err) throw err;
});
