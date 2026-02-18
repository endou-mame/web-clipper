import { ResultAsync } from "neverthrow";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { DomainError } from "../../domain/errors.js";
import { tags } from "../../infrastructure/persistence/schema.js";

export const deleteTag =
  (db: DrizzleD1Database) =>
  (id: string): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const existing = await db.select().from(tags).where(eq(tags.id, id)).get();
        if (!existing) {
          const error: DomainError = { type: "TAG_NOT_FOUND", id };
          throw error;
        }
        await db.delete(tags).where(eq(tags.id, id));
      })(),
      (error): DomainError => {
        if (typeof error === "object" && error !== null && "type" in error) {
          return error as DomainError;
        }
        return { type: "STORAGE_ERROR", cause: error };
      },
    );
