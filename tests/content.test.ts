// @vitest-enviroment node

import { describe, it, expect } from "vitest";
import { blogSchema } from "../src/blog.schema";
import { z } from "astro:content";
type BlogInput = z.input<typeof blogSchema>;

// todo: dateをどのタイミングで持つか要検討
const sampleDate = new Date("2025-01-01T00:00:00+09:00");

const draftPost = {
	visibility: "draft",
	title: "draft post",
	date: sampleDate,
} satisfies BlogInput;

const validPublicPost = {
	visibility: "public",
	// generates uuid v4, might be v7 in produciton env.
	id: crypto.randomUUID(),
	slug: "some-slug",
	title: "public post",
	date: sampleDate,
} satisfies BlogInput;

describe("blogSchema", () => {
	it("draft はid/slug なしでも通る", () => {
		const result = blogSchema.safeParse(draftPost);
		expect(result.success).toBe(true);
	});

	it("publicはidありでもslugがないと落ちる", () => {
		const { slug, ...invalidPublicPost } = validPublicPost;
		const result = blogSchema.safeParse(invalidPublicPost);
		expect(result.success).toBe(false);
		if (!result.success) {
			console.log(result.error.issues);
		}
	});
});
