import type { InferSelectModel } from "drizzle-orm";
import { ArticleIdVO, type ArticleId } from "../../domain/values/article-id.js";
import { ArticleUrlVO, type ArticleUrl } from "../../domain/values/article-url.js";
import { TagNameVO, type TagName } from "../../domain/values/tag-name.js";
import type { Source } from "../../domain/values/source.js";
import { ArticleEntity, type Article } from "../../domain/entities/mod.js";
import type { articles } from "./schema.js";

type ArticleRow = InferSelectModel<typeof articles>;

export const toDomain = (row: ArticleRow, tagNames: string[]): Article =>
  ArticleEntity.create({
    id: ArticleIdVO.schema.parse(row.id) as ArticleId,
    url: ArticleUrlVO.schema.parse(row.url) as ArticleUrl,
    title: row.title,
    description: row.description,
    source: row.source as Source,
    ogImageUrl: row.ogImageUrl,
    memo: row.memo,
    isRead: row.isRead,
    tags: tagNames.map((name) => TagNameVO.schema.parse(name) as TagName),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const toPersistence = (
  article: Article,
): Omit<ArticleRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  id: article.id,
  url: article.url,
  title: article.title,
  description: article.description,
  source: article.source,
  ogImageUrl: article.ogImageUrl,
  memo: article.memo,
  isRead: article.isRead,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
});
