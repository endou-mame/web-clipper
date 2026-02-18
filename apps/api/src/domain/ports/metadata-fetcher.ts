import type { ResultAsync } from "neverthrow";
import type { ArticleUrl } from "../values/mod.js";
import type { DomainError } from "../errors.js";

export type ArticleMetadata = {
  readonly title: string;
  readonly description: string | null;
  readonly ogImageUrl: string | null;
};

export type MetadataFetcher = {
  readonly fetch: (url: ArticleUrl) => ResultAsync<ArticleMetadata, DomainError>;
};
