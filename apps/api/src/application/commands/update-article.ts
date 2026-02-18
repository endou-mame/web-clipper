import { ok, err, type Result, type ResultAsync } from "neverthrow";
import type { ArticleRepository } from "../../domain/ports/mod.js";
import { ArticleIdVO } from "../../domain/values/article-id.js";
import { TagNameVO } from "../../domain/values/tag-name.js";
import { ArticleEntity, type Article } from "../../domain/entities/mod.js";
import type { DomainError } from "../../domain/errors.js";
import type { TagName } from "../../domain/values/mod.js";

type UpdateArticleDeps = {
  readonly articleRepo: ArticleRepository;
};

type UpdateArticleInput = {
  readonly id: string;
  readonly memo?: string | null;
  readonly tags?: readonly string[];
  readonly isRead?: boolean;
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

export const updateArticle =
  (deps: UpdateArticleDeps) =>
  (input: UpdateArticleInput): ResultAsync<Article, DomainError> =>
    ArticleIdVO.create(input.id)
      .asyncAndThen((id) =>
        deps.articleRepo
          .findById(id)
          .andThen((article) =>
            article ? ok(article) : err({ type: "ARTICLE_NOT_FOUND" as const, id: input.id }),
          ),
      )
      .andThen((article) => {
        let updated = article;

        if (input.memo !== undefined) {
          updated = ArticleEntity.updateMemo(updated, input.memo ?? null);
        }
        if (input.isRead !== undefined) {
          updated = input.isRead
            ? ArticleEntity.markAsRead(updated)
            : ArticleEntity.markAsUnread(updated);
        }
        if (input.tags !== undefined) {
          const tagsResult = validateTags(input.tags);
          if (tagsResult.isErr()) return err(tagsResult.error);
          updated = ArticleEntity.updateTags(updated, tagsResult.value);
        }

        return deps.articleRepo.save(updated);
      });
