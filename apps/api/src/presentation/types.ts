import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { ArticleRepository, MetadataFetcher } from "../domain/ports/mod.js";

export type Deps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
  readonly db: DrizzleD1Database;
};

export type Bindings = {
  DB: D1Database;
  API_TOKEN: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    deps: Deps;
  };
};
