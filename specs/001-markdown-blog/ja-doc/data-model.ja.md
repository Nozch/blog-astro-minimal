# データモデル

**機能**: ミニマルMarkdownブログ
**日付**: 2025-12-14
**ステータス**: 完了

## 概要

このブログは、YAMLフロントマターを持つMarkdownファイルが主要なデータストレージとして機能するファイルベースのデータモデルを使用しています。AstroのContent Collections APIは、ビルド時にこのデータへの型安全なアクセスを提供します。

## エンティティ

### 1. ブログ記事

**説明**: 単一の書かれたコンテンツを表します。

**ストレージ**: ファイルシステム（`src/content/posts/` 内の `.md` ファイル）

**スキーマ**:

| フィールド    | 型       | 必須   | デフォルト  | 検証                                 | 説明                                                                        |
| ------------- | -------- | ------ | ----------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `title`       | string   | はい   | -           | 空でない文字列                       | 見出しとメタデータに表示される記事タイトル                                  |
| `date`        | Date     | はい   | -           | 有効な ISO 日付                      | 公開日（フロントマターで YYYY-MM-DD 形式）                                  |
| `description` | string   | いいえ | `undefined` | -                                    | 記事リストプレビューの短い要約（1-2文）                                     |
| `tags`        | string[] | いいえ | `[]`        | 空でない文字列の配列（空配列可）     | 分類のためのトピックタグ                                                    |
| `draft`       | boolean  | いいえ | `false`     | -                                    | `true` の場合、記事はビルド出力から除外されます                             |
| `slug`        | string   | いいえ | 自動生成    | 英数字文字列（8-12文字）、日本語不可 | URLスラグ（省略された場合はランダム文字列、ファイル名からは生成されません） |

**派生フィールド**（ビルド時に計算）:

| フィールド    | 型     | 説明                                                                                                                     |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `slug`        | string | フロントマターからのランダムな英数字文字列（8-12文字）、または省略された場合は自動生成。ファイル名からは生成されません。 |
| `body`        | string | HTML としてレンダリングされた Markdown コンテンツ                                                                        |
| `readingTime` | number | 推定読書時間（分）（オプション、後で追加可能）                                                                           |

**Markdownファイルの例**:

```markdown
---
title: "Astroを始める"
date: 2025-12-14
description: "Astroのコンテンツ第一のアプローチで静的サイトを構築するガイド。"
tags: ["astro", "web-development", "tutorial"]
draft: false
slug: "a8k3n9x2"
---

# Astroを始める

これはMarkdownで書かれた記事のコンテンツです...
```

**関係**:

- **多数の** タグを持つ（`tags` 配列を介した多対多）
- **0個以上の** タグコレクションに属する

**検証ルール**（Zodスキーマによって適用）:

1. `title` は空でない文字列である必要があります
2. `date` は有効な Date オブジェクトである必要があります（フロントマターの YYYY-MM-DD から解析）
3. `description` はオプションですが、提供された場合は文字列である必要があります
4. `tags` はデフォルトで空配列（タグ0件可）、各タグは空でない文字列である必要があります
5. `draft` はデフォルトで `false`
6. `slug` はすべての記事間で一意である必要があります。重複するスラグはビルド失敗を引き起こします
7. フロントマターがスキーマと一致しない場合、ビルドは失敗します

**クエリパターン**:

```typescript
// すべての公開記事を取得（ドラフトを除外）
const posts = await getCollection("posts", ({ data }) => !data.draft);

// 日付でソート（新しい順）
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

// タグでフィルタリング
const tagged = posts.filter((post) => post.data.tags.includes("astro"));

// スラグで単一の記事を取得
const post = await getEntry("posts", "getting-started-with-astro");
```

### 2. タグ

**説明**: 記事をグループ化するトピックまたはテーマを表します。

**ストレージ**: 記事のフロントマターから派生（個別のストレージなし）

**スキーマ**:

| フィールド | 型     | 説明                                        |
| ---------- | ------ | ------------------------------------------- |
| `name`     | string | タグ名（例: "astro"、"web-development"）    |
| `slug`     | string | URL安全なスラグ（簡単のため `name` と同じ） |
| `count`    | number | このタグを持つ公開記事の数（派生）          |

**派生データ**:

- タグはビルド時にすべての公開記事から抽出されます
- タグページは `getStaticPaths()` を使用して動的に生成されます

**タグ抽出の例**:

```typescript
// すべての記事から一意のタグを抽出
const posts = await getCollection("posts", ({ data }) => !data.draft);
const tags = [...new Set(posts.flatMap((post) => post.data.tags))];

// 記事数付きのタグ
const tagCounts = tags.map((tag) => ({
	name: tag,
	slug: tag,
	count: posts.filter((p) => p.data.tags.includes(tag)).length,
}));
```

**関係**:

- **多数の** ブログ記事を持つ（記事の `tags` 配列を介した多対多）

### 3. サイトメタデータ

**説明**: グローバルサイト設定（タイトル、著者など）。

**ストレージ**: Astro設定ファイル（`astro.config.mjs`）および/または個別の設定ファイル

**スキーマ**:

| フィールド     | 型     | 必須   | デフォルト | 説明                                                       |
| -------------- | ------ | ------ | ---------- | ---------------------------------------------------------- |
| `title`        | string | はい   | -          | サイトタイトル（例: "My Blog"）                            |
| `description`  | string | いいえ | -          | メタタグ用のサイト説明                                     |
| `author`       | string | はい   | -          | 著者名                                                     |
| `url`          | string | はい   | -          | ベースURL（例: "https://example.com"）                     |
| `postsPerPage` | number | いいえ | `10`       | ページあたりの記事数（後でページネーションを追加する場合） |

**設定の例**:

```javascript
// astro.config.mjs
export default {
	site: "https://example.com",
	// ... その他のAstro設定
};
```

```typescript
// src/config.ts（サイトメタデータ）
export const siteConfig = {
	title: "My Blog",
	description: "Thoughts on web development and design",
	author: "Author Name",
	postsPerPage: 10,
};
```

## 状態遷移

### 記事のライフサイクル

```
[作成] → [ドラフト] → [公開] → [更新] → [アーカイブ/削除]
   ↓          ↓           ↓
   └──────────┴───────────┴─── (ビルドはドラフトを除外)
```

**状態**:

1. **作成**: 新しい `.md` ファイルが `src/content/posts/` に追加される
2. **ドラフト**: フロントマターで `draft: true` → ビルドから除外
3. **公開**: `draft: false`（または省略） → ビルドに含まれる
4. **更新**: ファイルが変更され、`date` は変更されない → 次のビルドで再レンダリング
5. **アーカイブ/削除**: ファイルが削除されるか `src/content/posts/` から移動される → ビルドから削除

**各段階での検証**:

- **作成**: フロントマターは Zod スキーマと一致する必要があり、そうでなければビルドが失敗します
- **公開**: ビルドに表示されるには `draft: false`（暗黙的または明示的）
- **更新**: すべてのビルドで再検証（スキーマ変更をキャッチ）

## データアクセスパターン

### ビルド時クエリ（Astro）

```typescript
import { getCollection, getEntry } from "astro:content";

// 1. すべての公開記事を取得（最も一般的）
const posts = await getCollection("posts", ({ data }) => !data.draft);

// 2. 日付でソートされた記事を取得（新しい順）
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

// 3. スラグで単一の記事を取得
const post = await getEntry("posts", "my-post-slug");

// 4. タグで記事を取得
const taggedPosts = posts.filter((post) => post.data.tags.includes("astro"));

// 5. 一意のタグを取得
const tags = [...new Set(posts.flatMap((post) => post.data.tags))];
```

### 型安全性

AstroはZodスキーマからTypeScript型を自動生成します:

```typescript
import type { CollectionEntry } from "astro:content";

type Post = CollectionEntry<"posts">;

// フロントマターへの型安全なアクセス
const post: Post = await getEntry("posts", "example");
console.log(post.data.title); // ✅ 型: string
console.log(post.data.date); // ✅ 型: Date
console.log(post.data.tags); // ✅ 型: string[]
console.log(post.data.unknown); // ❌ TypeScriptエラー
```

## データ整合性

### 検証ルール

1. **フロントマタースキーマ検証**:
   - ビルド時にZodによって適用
   - 無効なフロントマターは明確なエラーメッセージでビルド失敗を引き起こします
   - 例: `title` が欠落 → "Error: [posts/my-post.md] title is required"

2. **日付形式の検証**:
   - 日付は有効なISO 8601形式（YYYY-MM-DD）である必要があります
   - Astroは日付を自動的に解析して検証します
   - 無効な日付はビルド失敗を引き起こします

3. **スラグの一意性**:
   - Astroはコレクションごとに一意のスラグを適用します
   - 重複するスラグ（同じファイル名または `slug` フィールド）はビルドエラーを引き起こします

4. **ドラフトフィルタリング**:
   - `draft: true` の記事は本番ビルドに決して表示されません
   - ファイル除外ではなくクエリフィルタによって適用（ドラフトはリポジトリに残ります）

### エラー処理

**ビルド失敗**（フェイルファスト要件）:

- 無効なフロントマター → ファイルパスと検証エラーでビルドが失敗
- 重複するスラグ → 競合の詳細でビルドが失敗
- 不正なMarkdown → 解析エラーでビルドが失敗

**適切な劣化**:

- `description` が欠落 → 記事リストにプレビューが表示されない（フィールドはオプション）
- 空の `tags` 配列 → 記事はメインリストに表示されるが、タグリンクは表示されない

## 将来の拡張性

### 潜在的なスキーマ追加（MVP後）

| フィールド  | 型      | 目的                                               |
| ----------- | ------- | -------------------------------------------------- |
| `updated`   | Date    | 最終更新日（「更新日」通知用）                     |
| `featured`  | boolean | ホームページで記事をハイライト                     |
| `image`     | string  | 記事のヒーロー画像URL                              |
| `series`    | string  | 記事をシリーズにグループ化（例: "React Tutorial"） |
| `canonical` | string  | クロスポストされたコンテンツの正規URL              |

**移行戦略**:

- すべての新しいフィールドはオプション（デフォルト値）である必要があります
- 既存の記事は変更なしで動作します
- Zodスキーマのバージョニング（重大な変更が必要な場合）

## パフォーマンスの考慮事項

### ビルド時のパフォーマンス

- **クエリ最適化**: コレクションフィルタを使用してドラフト記事の読み込みを回避
- **ソート**: 配列をメモリ内でソート（データベースインデックスは不要）
- **タグ抽出**: 記事配列の単一パス（O(n)複雑度）

### ランタイムパフォーマンス

- **ランタイムクエリなし**: すべてのデータがビルド時に解決されます
- **静的HTML**: 記事は静的HTMLにレンダリングされ、クライアント側のデータフェッチはありません
- **タグページ**: ビルド中に事前レンダリング（動的ルートなし）

**予想される規模**:

- 100記事: <5秒のビルド時間（SC-008、SC-009による）
- 1000記事: インクリメンタルビルドでまだ実行可能（将来のAstro機能）

## スキーマ実装

正規のスキーマ定義については `contracts/frontmatter-schema.yaml` を参照してください。

TypeScript実装:

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const posts = defineCollection({
	schema: z.object({
		title: z.string(),
		date: z.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
```

このスキーマはすべての検証ルールを適用し、コンテンツクエリの型安全性を提供します。
