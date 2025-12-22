import { z } from "astro:content";
export const blogSchema = z.discriminatedUnion("visibility", [
	z.object({
		visibility: z.literal("draft"),
		title: z.string(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
	z.object({
		visibility: z.enum(["public", "private", "unlisted", "withdrawn"]),
		id: z.string().uuid(),
		slug: z.string(),
		title: z.string(),
		publishedAt: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
]);
export type BlogInput = z.input<typeof blogSchema>
