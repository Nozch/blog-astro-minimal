import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { draftPostSchema, blogPostSchema } from "./blog.schema";

const draftCollection = defineCollection({
	schema: draftPostSchema,
});

const blogCollection = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: blogPostSchema,
});

export const collections = {
	draftCollection,
	blogCollection,
};
