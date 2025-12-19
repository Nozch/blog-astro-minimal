// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { defineCollection, z } from "astro:content";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), sitemap()],
});

const blog = defineCollection({
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
