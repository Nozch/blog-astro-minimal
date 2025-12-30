import { z } from "astro:content";
export const draftPostSchema = z.object({
	visibility: z.literal("draft"),
	title: z.string(),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
});

export const blogPostSchema = z.object({
	visibility: z.enum(["public", "private", "unlisted", "withdrawn"]),
	id: z.string().uuid(),
	slug: z.string(),
	title: z.string(),
	publishedAt: z.coerce.date(),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
});
