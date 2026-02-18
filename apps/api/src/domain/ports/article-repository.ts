import type { ResultAsync } from "neverthrow";
import type { Article } from "../entities/mod.js";
import type { ArticleId, ArticleUrl } from "../values/mod.js";
import type { DomainError } from "../errors.js";

export type ArticleRepository = {
  readonly findById: (id: ArticleId) => ResultAsync<Article | null, DomainError>;
  readonly findByUrl: (url: ArticleUrl) => ResultAsync<Article | null, DomainError>;
  readonly save: (article: Article) => ResultAsync<Article, DomainError>;
  readonly delete: (id: ArticleId) => ResultAsync<void, DomainError>;
};
