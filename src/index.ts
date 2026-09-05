import Fastify from "fastify";
import formbody from "@fastify/formbody";
import staticPlugin from "@fastify/static";
import { join } from "node:path";
import { loadConfig } from "./config.js";
import { registerProxyRoutes } from "./proxy.js";

const config = loadConfig();
const app = Fastify({ logger: true });

// Parses application/x-www-form-urlencoded bodies so form POSTs can be
// re-serialized and forwarded to the origin.
app.register(formbody);
app.register(staticPlugin, {
  root: join(process.cwd(), "vendor", "emulatorjs"),
  prefix: "/emulatorjs/",
});

registerProxyRoutes(app, config);

app.listen({ host: config.host, port: config.port }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
