import Fastify from "fastify";
import path from "path";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const fastify = Fastify({
  logger: true,
});

await fastify.register(import("@fastify/rate-limit"), {
  max: 10,
  timeWindow: "1 minute",
});

await fastify.register(import("@fastify/cors"), {
  origin: false,
  methods: ["GET", "POST"],
});

await fastify.register(import("fastify-static"), {
  root: path.join(__dirname, "public"),
});

let participants = [];

fastify.get("/", () => {
  return "Boo...";
})

fastify.listen({ port: process.env.PORT || 3000 }, err => {
  if (err) throw err;
})