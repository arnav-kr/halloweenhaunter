import Fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import bolt from '@slack/bolt';
const { App } = bolt;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const fastify = Fastify({
  logger: true,
});

await fastify.register(import("@fastify/rate-limit"), {
  global: false,
  allowList: ["127.0.0.1", "::1"],
});

/**
 * max: 10,
 * timeWindow: "1 minute",
 */

await fastify.register(import("@fastify/cors"), {
  origin: false,
  methods: ["GET", "POST"],
});

await fastify.register(import("@fastify/static"), {
  root: path.join(__dirname, "public"),
});

let participants = [];
fastify.post("/api/haunt", {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
}, (req) => {
  let { slack_id } = req.body;
  fastify.log.info(`Slack ID: ${slack_id}`);
  return { data: "success", code: 200 };
});

fastify.listen({ port: process.env.PORT || 3000 }, err => {
  if (err) throw err;
});

await app.start(8080);