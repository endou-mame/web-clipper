import { nanoid } from "nanoid";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { TagNameVO } from "../../domain/values/tag-name.js";
import type { DomainError } from "../../domain/errors.js";
import { tags } from "../../infrastructure/persistence/schema.js";

type TagResult = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
};

export const createTag =
  (db: DrizzleD1Database) =>
  (name: string): ResultAsync<TagResult, DomainError> =>
    TagNameVO.create(name)
      .asyncAndThen((validName) =>
        ResultAsync.fromPromise(
          db.select().from(tags).where(eq(tags.name, validName)).get(),
          (e): DomainError => ({ type: "STORAGE_ERROR", cause: e }),
        ).andThen((existing) =>
          existing ? errAsync({ type: "TAG_ALREADY_EXISTS" as const, name }) : okAsync(validName),
        ),
      )
      .andThen((validName) =>
        ResultAsync.fromPromise(
          (async () => {
            const id = nanoid();
            const now = new Date();
            await db.insert(tags).values({ id, name: validName, createdAt: now });
            return { id, name: validName as string, createdAt: now };
          })(),
          (e): DomainError => ({ type: "STORAGE_ERROR", cause: e }),
        ),
      );
