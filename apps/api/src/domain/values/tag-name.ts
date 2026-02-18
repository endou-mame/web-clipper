import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import type { DomainError } from "../errors.js";

const TagNameSchema = z.string().trim().min(1).max(50).brand<"TagName">();
export type TagName = z.infer<typeof TagNameSchema>;

const create = (input: string): Result<TagName, DomainError> => {
  const parsed = TagNameSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "INVALID_TAG_NAME" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

export const TagNameVO = { create, schema: TagNameSchema } as const;
