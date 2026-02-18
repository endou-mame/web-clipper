import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { drizzle } from "drizzle-orm/d1";
import type { AppEnv } from "./presentation/types.js";
import { createD1ArticleRepository } from "./infrastructure/persistence/d1-article-repository.js";
import { createFetchMetadataFetcher } from "./infrastructure/services/fetch-metadata-fetcher.js";
import { healthRoutes } from "./presentation/routes/health.js";
import { articleRoutes } from "./presentation/routes/articles.js";
import { tagRoutes } from "./presentation/routes/tags.js";

const base = new OpenAPIHono<AppEnv>();

// --- CORS ---
base.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- DI middleware ---
base.use("/api/*", async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set("deps", {
    articleRepo: createD1ArticleRepository(db),
    metadataFetcher: createFetchMetadataFetcher(),
    db,
  });
  await next();
});

// --- Auth middleware (skip health and docs) ---
base.use("/api/articles/*", async (c, next) => {
  const auth = bearerAuth({ token: c.env.API_TOKEN });
  return auth(c, next);
});
base.use("/api/tags/*", async (c, next) => {
  const auth = bearerAuth({ token: c.env.API_TOKEN });
  return auth(c, next);
});

// --- Mount routes (chained for Hono RPC type inference) ---
const app = base.route("/", healthRoutes).route("/", articleRoutes).route("/", tagRoutes);

// --- OpenAPI spec endpoint ---
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    title: "Web Clipper API",
    version: "1.0.0",
  },
});

// --- Scalar API Reference UI ---
app.get("/api/reference", Scalar({ url: "/api/doc" }));

export type AppType = typeof app;
export default app;
