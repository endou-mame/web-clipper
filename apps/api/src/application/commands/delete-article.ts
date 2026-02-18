import { ok, err } from "neverthrow";
import type { ResultAsync } from "neverthrow";
import type { ArticleRepository } from "../../domain/ports/mod.js";
import { ArticleIdVO } from "../../domain/values/article-id.js";
import type { DomainError } from "../../domain/errors.js";

export const deleteArticle =
  (deps: { readonly articleRepo: ArticleRepository }) =>
  (id: string): ResultAsync<void, DomainError> =>
    ArticleIdVO.create(id)
      .asyncAndThen((articleId) =>
        deps.articleRepo
          .findById(articleId)
          .andThen((article) =>
            article ? ok(articleId) : err({ type: "ARTICLE_NOT_FOUND" as const, id }),
          ),
      )
      .andThen((articleId) => deps.articleRepo.delete(articleId));
