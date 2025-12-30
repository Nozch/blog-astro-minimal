# 調査と技術的決定

**機能**: ミニマルMarkdownブログ
**日付**: 2025-12-14
**ステータス**: 完了

## 概要

このドキュメントは、Astroの静的サイト生成機能を使用して、ミニマルでコンテンツ第一のブログを実装するための調査結果と技術的決定を記録しています。

## 技術スタックの決定

### 1. 静的サイトジェネレータ: Astro

**決定**: 主要フレームワークとして Astro v4+ を使用

**理由**:

- **明示的な要件**: ユーザー入力で「Astroは静的サイトジェネレータとして必須」と指定されています
- **コンテンツコレクション**: Astroの組み込みコンテンツコレクションは、Zodスキーマを使用した型安全なフロントマター検証を提供します
- **アイランドアーキテクチャ**: 最小限のクライアントJavaScriptを可能にします（テーマ切り替えのみがJSを必要とします）
- **Markdownファースト**: 追加設定なしで `.md` ファイルのネイティブサポート（高度なMDXコンポーネントはMVPスコープから除外）
- **パフォーマンス**: デフォルトでJavaScriptをゼロ出荷し、憲法の静的ファースト原則と整合しています
- **ビルド時レンダリング**: すべてのページはビルド時に生成され、サーバーランタイムは不要です

**検討した代替案**: N/A（Astroは必須要件）

**実装メモ**:

- `src/content/config.ts` で `defineCollection()` を使用してフロントマタースキーマを検証
- コンテンツコレクションは自動的にスラグ生成とクエリを処理します
- 組み込みのMarkdownパーサーは標準構文を箱から出して即座にサポートします

### 2. シンタックスハイライト: Shiki

**決定**: Shiki（Astroのデフォルトシンタックスハイライター）を使用

**理由**:

- **ランタイムコストゼロ**: ハイライトはビルド時に行われ、クライアントJavaScriptは不要
- **Astroに組み込み**: 追加の依存関係や設定は不要
- **TextMate文法**: VS Codeと同じシンタックスハイライト、高品質
- **テーマサポート**: 複数のテーマが付属し、ライト/ダークモードの切り替えをサポート
- **パフォーマンス**: 静的HTML出力は、ハイドレーションやランタイムオーバーヘッドがないことを意味します

**検討した代替案**:

- **Prism.js**: クライアント側JavaScriptまたは追加のビルドセットアップが必要。Shikiが組み込みでランタイムゼロであるため却下。
- **Highlight.js**: Prismと同様の懸念。Shikiのビルド時アプローチは静的サイトに優れています。

**実装メモ**:

- `astro.config.mjs` の `markdown.shikiConfig` で設定
- ライト/ダークモード用のデュアルテーマを使用（例: `github-light` と `github-dark`）
- コードブロックはインラインスタイルで `<pre>` と `<code>` を使用（ランタイムテーマ切り替えなし）

### 3. コンテンツ検証: Zod

**決定**: フロントマタースキーマ検証にZodを使用（Astro Content Collections経由）

**理由**:

- **Astroに組み込み**: コンテンツコレクションはデフォルトでZodを使用します
- **型安全性**: ZodスキーマからTypeScript型が自動生成されます
- **ビルド時検証**: 無効なフロントマターは明確なエラーメッセージでビルドを失敗させます（「フェイルファスト」要件を満たします）
- **豊富な検証**: 複雑な検証ルール（日付形式、列挙型、オプションフィールド、デフォルト値）をサポートします

**検討した代替案**: N/A（ZodはAstroのコンテンツコレクションの標準）

**実装メモ**:

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

### 4. テーマ戦略: CSSカスタムプロパティ + localStorage

**決定**: テーマにCSSカスタムプロパティ（CSS変数）を使用し、クライアント側のlocalStorage永続化を実装

**理由**:

- **憲法要件**: 「デザイントークンはCSSカスタムプロパティで定義する必要があります」
- **ランタイムコストなし（ほとんど）**: テーマ値はCSS変数であり、レンダリングにJavaScriptは不要
- **プログレッシブエンハンスメント**: サイトはJavaScriptなしで動作し、テーマ切り替えにはJSが必要
- **シンプルな実装**: 切り替えは `<html>` に `data-theme="dark"` 属性を追加/削除します
- **ユーザー設定**: localStorageはセッション間で選択を永続化します（FR-008）

**検討した代替案**:

- **Tailwindダークモードクラス**: 不要なビルドの複雑さとより大きなCSSバンドルを追加します。CSSカスタムプロパティはよりシンプルで保守しやすいです。
- **サーバー側テーマ検出**: CookieまたはSSRが必要で、静的ファースト制約に違反します。

**実装メモ**:

```css
/* global.css */
:root {
	--color-text: #1a1a1a;
	--color-bg: #ffffff;
	--color-accent: #0066cc;
}

[data-theme="dark"] {
	--color-text: #e0e0e0;
	--color-bg: #1a1a1a;
	--color-accent: #4da6ff;
}
```

```javascript
// ThemeToggleインラインスクリプト（最小限のJS）
if (
	localStorage.theme === "dark" ||
	(!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
	document.documentElement.setAttribute("data-theme", "dark");
}
```

### 5. タイポグラフィシステム: システムフォントスタック + 流動的タイポグラフィ

**決定**: clampベースの流動的タイポグラフィでシステムフォントスタックを使用

**理由**:

- **パフォーマンス**: フォントのダウンロードなし、即座のテキストレンダリング（FCP <1.5s要件）
- **読みやすさ**: システムフォントは画面での読書に最適化されています
- **アクセシビリティ**: ユーザーは既にシステムフォントに慣れています
- **レスポンシブ**: `clamp()` はメディアクエリなしでブレークポイント間の流動的なスケーリングを提供します

**検討した代替案**:

- **Webフォント（Google Fontsなど）**: ネットワークリクエストとレンダリングブロッキング時間を追加します。パフォーマンス上の理由で却下。
- **可変フォント**: まだダウンロードが必要です。システムフォントの方が高速です。

**実装メモ**:

```css
:root {
	--font-body:
		-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	--font-mono: "SF Mono", Monaco, "Cascadia Code", "Consolas", monospace;
	--font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); /* 16-18px */
	--line-height: 1.7;
	--measure: 65ch; /* 最適な行長 */
}
```

### 6. テスト戦略: Vitest + TypeScript

**決定**: 統合テストにVitest、型安全性にTypeScriptを使用し、MVPではE2Eテストなし

**理由**:

- **ユーザー要件**: 「自動テストにVitestを使用」
- **憲法との整合性**: 「高価値の最小限のテスト」 - 統合テストに焦点を当て、プレゼンテーショナルコンポーネントの単体テストをスキップ
- **高速**: Vitestは Jest より高速で、バンドリングに Vite を使用（Astro は内部的に Vite を使用）
- **TypeScript**: 多くのエラーをコンパイル時にキャッチし、ランタイムテストの必要性を減らします
- **MVPではE2Eなし**: Playwright/Cypressは複雑さを追加します。統合テスト（ビルド出力検証）は重要な問題をキャッチします。

**テストカバレッジ**:

1. **コンテンツ検証**: フロントマタースキーマが無効な記事をキャッチすることを確認
2. **ビルド出力**: 公開記事用の静的HTMLが生成されることを確認
3. **ドラフトフィルタリング**: ドラフト記事がビルドから除外されることを確認
4. **スラグ生成**: 決定論的なスラグ生成を確認

**検討した代替案**:

- **Jest**: Vitestより遅く、ESMモジュールでより多くの設定が必要
- **Playwright E2E**: MVPには過剰。統合テストは静的サイトに十分

**実装メモ**:

```typescript
// tests/content.test.ts
import { getCollection } from "astro:content";
import { describe, it, expect } from "vitest";

describe("Content Collections", () => {
	it("excludes draft posts from published collection", async () => {
		const posts = await getCollection("posts", ({ data }) => !data.draft);
		const hasDrafts = posts.some((post) => post.data.draft);
		expect(hasDrafts).toBe(false);
	});
});
```

### 7. CI/CDパイプライン: GitHub Actions

**決定**: CI（型チェック、リント、ビルド、テスト）にGitHub Actionsを使用

**理由**:

- **ユーザー要件**: 「最低限、CIで型チェック、リント、ビルド、Vitestを実行」
- **パブリックリポジトリは無料**: オープンソースブログのコストなし
- **シンプルなセットアップ**: YAML設定、ネイティブGitHub統合
- **キャッシング**: `node_modules` の組み込みキャッシングがビルドを高速化

**パイプラインステップ**:

1. 依存関係のインストール（`npm ci`）
2. 型チェック（`tsc --noEmit`）
3. リント（`eslint .`）
4. テスト実行（`vitest run`）
5. サイトのビルド（`astro build`）

**検討した代替案**:

- **CircleCI/Travis**: 静的サイトにおいてGitHub Actionsに対する利点なし
- **Netlify/Vercel CI**: デプロイメントプラットフォームはデプロイメントを処理しますが、GitHub ActionsはCIチェックのためのより多くの制御を提供します

**実装メモ**:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### 8. URL構造: `/posts/[slug]`

**決定**: ブログ記事のURLに `/posts/[slug]` パターンを使用

**理由**:

- **シンプルさ**: フラットなURL構造、日付ベースのパスなし（複雑さを軽減）
- **耐久性**: 記事の日付が変更されてもスラグベースのURLは安定
- **予測可能性**: 予測可能なURL構造の仕様要件（FR-004）と一致
- **SEO**: 説明的なスラグは数値IDや日付パスよりも検索エンジンに適しています

**検討した代替案**:

- **`/[year]/[month]/[slug]`**: より複雑で、保守が困難、少量ブログにはSEOの利点なし
- **`/[slug]`（ルートレベル）**: 他の潜在的なページ（about、contactなど）と競合

**実装メモ**:

- スラグはランダムな英数字文字列（8-12文字）で、フロントマターで指定または自動生成
- ファイル名から派生しません（ファイル名は日本語/英語/混在可能）

### 9. タグページ: 動的ルート

**決定**: Astroの `getStaticPaths()` を使用してタグページを動的に生成

**理由**:

- **静的生成**: すべてのタグページはビルド時に事前レンダリング
- **設定不要**: タグは記事のフロントマターから自動的に検出
- **スケーラブル**: 手動でルートを作成することなく、任意の数のタグで動作

**実装メモ**:

```typescript
// src/pages/tags/[tag].astro
export async function getStaticPaths() {
	const posts = await getCollection("posts", ({ data }) => !data.draft);
	const tags = [...new Set(posts.flatMap((post) => post.data.tags))];

	return tags.map((tag) => ({
		params: { tag },
		props: { posts: posts.filter((p) => p.data.tags.includes(tag)) },
	}));
}
```

## パフォーマンス最適化

### 1. 画像処理（MVP後に延期）

**決定**: MVP用の自動画像最適化なし

**理由**:

- **仕様の除外**: 「画像最適化またはレスポンシブ画像生成（画像はコンテンツに追加する前に最適化されていると仮定）」
- **シンプルさ**: ユーザーは記事に追加する前に手動で画像を最適化
- **将来の改善**: 既存の記事を壊すことなく、後でAstroの `<Image>` コンポーネントを追加可能

### 2. CSS戦略: 単一のグローバルスタイルシート

**決定**: CSSカスタムプロパティを持つ単一の `global.css` ファイル、MVPではCSSモジュールやスコープ付きスタイルなし

**理由**:

- **シンプルさ**: 最小限のコンポーネントセット（5-6コンポーネント）はCSSモジュールの恩恵を受けません
- **パフォーマンス**: 単一のCSSファイル、CSS-in-JSオーバーヘッドなし
- **憲法**: 「早すぎる抽象化を避ける」 - CSSモジュールは必要に応じて後で追加可能

**検討した代替案**:

- **Tailwind CSS**: ビルドの複雑さ、より大きな初期バンドルを追加。最小限のデザインにはカスタムCSSがよりシンプル。
- **CSSモジュール**: 小さなコンポーネントセットには不要、複雑さを追加。

### 3. ビルドパフォーマンス: インクリメンタルビルド

**決定**: Astroのインクリメンタルビルド（将来のAstro機能）とViteのキャッシングに依存

**理由**:

- **仕様要件**: SC-008は記事ごとに<5秒のビルド時間増加を要求
- **現在の状態**: Astroは変更時にすべてのページを再ビルドしますが、Viteは依存関係をキャッシュします
- **将来性**: Astroのロードマップにはインクリメンタルビルドが含まれており、現在はアクションは不要

## セキュリティの考慮事項

### 1. XSS保護

**決定**: テンプレートでのAstroの自動エスケープに依存

**理由**:

- **デフォルトの安全性**: Astroはデフォルトですべての動的コンテンツをエスケープします
- **Markdownサニタイゼーション**: AstroのMarkdownパーサーはデフォルトでHTMLをサニタイズします
- **ユーザー入力なし**: ブログにはフォームやユーザー生成コンテンツがありません（著者が書いたMarkdownのみ）

### 2. 依存関係管理

**決定**: CIで `npm audit` を使用し、自動更新にDependabotを使用

**理由**:

- **自動チェック**: 高重大度の脆弱性でCIが失敗
- **ゼロ労力の更新**: Dependabotは依存関係の更新のためのPRを作成
- **静的サイト**: 限定的な攻撃対象領域（サーバーランタイムなし、データベースなし）

## 未解決の質問（解決済み）

すべての技術的不明点は解決されています。未解決の明確化は必要ありません。

## 参考資料

- [Astroドキュメント](https://docs.astro.build/)
- [Astroコンテンツコレクション](https://docs.astro.build/en/guides/content-collections/)
- [Shikiシンタックスハイライター](https://shiki.style/)
- [Vitestドキュメント](https://vitest.dev/)
- [WCAG 2.1 AAガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSSカスタムプロパティMDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
