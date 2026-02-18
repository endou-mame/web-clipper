import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { tags, articleTags } from "../../infrastructure/persistence/schema.js";

type TagWithCount = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly articleCount: number;
};

export const listTags = (db: DrizzleD1Database) => async (): Promise<readonly TagWithCount[]> => {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      createdAt: tags.createdAt,
      articleCount: sql<number>`count(${articleTags.tagId})`,
    })
    .from(tags)
    .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
    .groupBy(tags.id)
    .orderBy(tags.name)
    .all();

  return rows;
};
