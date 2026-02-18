import { z } from "zod";

// CreateTagInput
export const CreateTagInputSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;

// TagResponse
export const TagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  articleCount: z.number(),
  createdAt: z.string(),
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

// TagListResponse
export const TagListResponseSchema = z.object({
  tags: z.array(TagResponseSchema),
});
export type TagListResponse = z.infer<typeof TagListResponseSchema>;
