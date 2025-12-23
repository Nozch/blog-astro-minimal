// @vitest-environment node

import { describe, it, expect } from "vitest";
import { blogSchema } from "../src/blog.schema";
import type { BlogInput } from "../src/blog.schema";

describe("BlogSchema validation", () => {
	const sampleDate = new Date("2025-01-01T00:00:00+09:00");
		
	describe("記事の下書き段階ではidとslugが未定でもOK", () => {
		const draftPost = {
			visibility: "draft",
			title: "draft post",
		} satisfies BlogInput

		it("idもslugもなくても有効", () => {
			const result = blogSchema.safeParse(draftPost);
			expect(result.success).toBe(true);
		});
	});

	describe("一度公開された記事データはid, slugいずれかでも欠けていると不正", () => {
		const validPublicPost = {
			visibility: "public",
			id: crypto.randomUUID(),
			slug: "some-slug",
			title: "public post",
			publishedAt: sampleDate,
		} satisfies BlogInput;

		it("slugが欠けている場合は無効", () => {
			const { slug, ...invalidPost } = validPublicPost;
			const result = blogSchema.safeParse(invalidPost);
			expect(result.success).toBe(false);
		});

		it("idが欠けている場合は無効", () => {
			const { id, ...invalidPost } = validPublicPost;
			const result = blogSchema.safeParse(invalidPost);
			expect(result.success).toBe(false);
		});
	});
});
