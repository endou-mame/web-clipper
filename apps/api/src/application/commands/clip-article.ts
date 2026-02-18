import { ok, err, type Result, type ResultAsync } from "neverthrow";
import type { ArticleRepository, MetadataFetcher } from "../../domain/ports/mod.js";
import { ArticleIdVO } from "../../domain/values/article-id.js";
import { ArticleUrlVO } from "../../domain/values/article-url.js";
import { TagNameVO } from "../../domain/values/tag-name.js";
import { SourceVO } from "../../domain/values/source.js";
import { ArticleEntity, type Article } from "../../domain/entities/mod.js";
import type { DomainError } from "../../domain/errors.js";
import type { TagName } from "../../domain/values/mod.js";

type ClipArticleDeps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
};

type ClipArticleInput = {
  readonly url: string;
  readonly tags: readonly string[];
  readonly memo?: string;
};

const validateTags = (tagInputs: readonly string[]): Result<readonly TagName[], DomainError> => {
  const validated: TagName[] = [];
  for (const input of tagInputs) {
    const result = TagNameVO.create(input);
    if (result.isErr()) return err(result.error);
    validated.push(result.value);
  }
  return ok(validated);
};

export const clipArticle =
  (deps: ClipArticleDeps) =>
  (input: ClipArticleInput): ResultAsync<Article, DomainError> =>
    ArticleUrlVO.create(input.url)
      .asyncAndThen((url) =>
        deps.articleRepo
          .findByUrl(url)
          .andThen((existing) =>
            existing ? err({ type: "ARTICLE_ALREADY_EXISTS" as const, url: input.url }) : ok(url),
          ),
      )
      .andThen((url) => deps.metadataFetcher.fetch(url).map((metadata) => ({ url, metadata })))
      .andThen(({ url, metadata }) => {
        const tagsResult = validateTags(input.tags);
        if (tagsResult.isErr()) return err(tagsResult.error);

        const now = new Date();
        const article = ArticleEntity.create({
          id: ArticleIdVO.generate(),
          url,
          title: metadata.title,
          description: metadata.description,
          source: SourceVO.fromUrl(input.url),
          ogImageUrl: metadata.ogImageUrl,
          memo: input.memo ?? null,
          isRead: false,
          tags: tagsResult.value,
          createdAt: now,
          updatedAt: now,
        });

        return ok(article);
      })
      .andThen((article) => deps.articleRepo.save(article));
