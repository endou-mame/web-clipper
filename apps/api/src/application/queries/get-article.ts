import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { articles, tags, articleTags } from "../../infrastructure/persistence/schema.js";

type ArticleDetail = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: string;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly isRead: boolean;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const getArticle =
  (db: DrizzleD1Database) =>
  async (id: string): Promise<ArticleDetail | null> => {
    const row = await db.select().from(articles).where(eq(articles.id, id)).get();
    if (!row) return null;

    const tagRows = await db
      .select({ name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, id))
      .all();

    return {
      ...row,
      tags: tagRows.map((t) => t.name),
    };
  };
