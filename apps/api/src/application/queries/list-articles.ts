import { desc, eq, like, and, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { articles, tags, articleTags } from "../../infrastructure/persistence/schema.js";

type ListArticlesParams = {
  readonly source?: string;
  readonly tagName?: string;
  readonly isRead?: boolean;
  readonly search?: string;
  readonly cursor?: string;
  readonly limit?: number;
};

type ArticleListItem = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: string;
  readonly ogImageUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: Date;
};

type ListArticlesResult = {
  readonly articles: readonly ArticleListItem[];
  readonly nextCursor: string | null;
};

const articleColumns = {
  id: articles.id,
  url: articles.url,
  title: articles.title,
  description: articles.description,
  source: articles.source,
  ogImageUrl: articles.ogImageUrl,
  isRead: articles.isRead,
  createdAt: articles.createdAt,
} as const;

export const listArticles =
  (db: DrizzleD1Database) =>
  async (params: ListArticlesParams): Promise<ListArticlesResult> => {
    const limit = params.limit ?? 20;

    const conditions = [];
    if (params.source) conditions.push(eq(articles.source, params.source));
    if (params.isRead !== undefined) conditions.push(eq(articles.isRead, params.isRead));
    if (params.search) conditions.push(like(articles.title, `%${params.search}%`));

    if (params.cursor) {
      const cursorArticle = await db
        .select({ createdAt: articles.createdAt })
        .from(articles)
        .where(eq(articles.id, params.cursor))
        .get();
      if (cursorArticle) {
        conditions.push(lt(articles.createdAt, cursorArticle.createdAt));
      }
    }

    let query;
    if (params.tagName) {
      query = db
        .select(articleColumns)
        .from(articles)
        .innerJoin(articleTags, eq(articles.id, articleTags.articleId))
        .innerJoin(tags, eq(articleTags.tagId, tags.id))
        .where(and(eq(tags.name, params.tagName), ...conditions))
        .orderBy(desc(articles.createdAt))
        .limit(limit + 1);
    } else {
      query = db
        .select(articleColumns)
        .from(articles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(articles.createdAt))
        .limit(limit + 1);
    }

    const rows = await query.all();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    return {
      articles: items,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  };
