import { getCollection } from "astro:content";

export async function getPublicPosts() {
	const posts = await getCollection("blogCollection", ({ data }) => {
		return data.visibility === "public";
	});
	return posts;
}

export async function getPublicPostById(id: string) {
	const posts = await getCollection("blogCollection", ({ data }) => {
		return data.visibility === "public";
	});
	return posts.find((post) => post.data.id === id);
}
