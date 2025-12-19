import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z
		.object({
			title: z.string(),
			// todo: test if zod(v3) supports uuid(v7). if not, use custom regex instead or loosen varification
			id: z.string().uuid(),
			visibility: z.enum(["draft", "private", "unlisted", "public", "withdrawn"]),
			date: z.coerce.date(),
			slug: z.string().optional(),
			description: z.string().optional(),
			tags: z.array(z.string()).default([]),
		})
});

export const collections = { blog };
