import { z } from "astro:content";

export const blogSchema = z.discriminatedUnion("visibility", [
	z.object({
		visibility: z.literal("draft"),
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),

	// draft以外はid, slugを必須とする.
	z.object({
		visibility: z.enum(["public", "private", "unlisted", "withdrawn"]),
		id: z.string().uuid(),
		slug: z.string(),
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
]);
