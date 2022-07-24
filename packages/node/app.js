"use strict";

import Fastify from "fastify";
import { getRoutesAndIpfs } from "./route.js";

const fastify = Fastify({
  logger: true,
});

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    const { routes, ipfsClient } = await getRoutesAndIpfs();
    routes.forEach((route) => {
      fastify.route(route);
    });
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
