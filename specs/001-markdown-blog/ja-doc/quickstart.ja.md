# クイックスタートガイド: ミニマルMarkdownブログ

**機能**: ミニマルMarkdownブログ
**日付**: 2025-12-14
**対象読者**: この機能を実装する開発者

## 前提条件

- Node.js 18+ がインストール済み
- npm または pnpm パッケージマネージャー
- Git（バージョン管理用）
- テキストエディタ（Astroサポートのため VS Code を推奨）

## プロジェクトセットアップ (5分)

> **📚 設計コンテキスト**: 完全なプロジェクト構造については [plan.md](./plan.md#project-structure) を、静的サイトジェネレータとしてAstroが選ばれた理由については [research.md](./research.md#1-static-site-generator-astro) を参照してください。

### 1. Astroプロジェクトの初期化

> **設計参照**: [research.md - Static Site Generator: Astro](./research.md#1-static-site-generator-astro)
> **理由**: Astroは明示的に要求されており、組み込みのコンテンツコレクション、Markdownサポート、デフォルトでゼロJSのアーキテクチャを提供します。

```bash
# 新しいAstroプロジェクトを作成
npm create astro@latest

# プロンプトに従う:
# - Where should we create your new project? → .
# - How would you like to start? → Empty
# - Install dependencies? → Yes
# - TypeScript? → Yes (strict)
# - Initialize git? → Yes (リポジトリにまだない場合)
```

### 2. 依存関係のインストール

> **設計参照**: [research.md - Testing Strategy: Vitest](./research.md#6-testing-strategy-vitest--typescript)
> **理由**: Vitestはユーザー要件により必須です。TypeScriptはコンパイル時の型安全性を提供し、ランタイムテストの必要性を減らします。

```bash
# テスト依存関係をインストール
npm install -D vitest @vitest/ui
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Astroにはデフォルトで以下が含まれます（インストール不要）:
# - Markdown/MDX サポート
# - Shiki シンタックスハイライター（ビルド時、ランタイムコストゼロ）
# - TypeScript
```

### 3. プロジェクト構造

> **設計参照**: [plan.md - Source Code Structure](./plan.md#source-code-repository-root)
> **理由**: Astroは規約を強制します - コンテンツコレクションには `src/content/`、ファイルベースルーティングには `src/pages/`、共有レイアウトには `src/layouts/` を使用します。

以下のディレクトリを作成:

```bash
mkdir -p src/content/posts
mkdir -p src/layouts
mkdir -p src/components
mkdir -p src/styles
mkdir -p tests
```

### 4. ESLintの設定

> **設計参照**: [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript)
> **理由**: ESLintは一般的なエラーをキャッチし、コードスタイルを強制します。TypeScript固有のルールを使用することで、型を考慮したリントを保証します。

`.eslintrc.json` を作成:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended"
  ],
  "overrides": [
    {
      "files": ["*.astro"],
      "parser": "astro-eslint-parser",
      "parserOptions": {
        "parser": "@typescript-eslint/parser",
        "extraFileExtensions": [".astro"]
      }
    }
  ],
  "rules": {}
}
```

**注意**: `plugin:astro/recommended` が必要な場合はインストール:
```bash
npm install -D eslint-plugin-astro astro-eslint-parser
```

### 5. .gitignore の作成

> **理由**: 生成ファイル、依存関係、機密データをバージョン管理にコミットすることを防ぎます。

`.gitignore` を作成:

```
# 依存関係
node_modules/

# ビルド出力
dist/
.astro/

# 環境変数
.env
.env.local
.env.production

# macOS固有ファイル
.DS_Store

# ログ
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# エディタディレクトリ
.vscode/
.idea/
```

## コア実装 (30分)

### 1. コンテンツコレクションスキーマの定義

> **設計参照**:
> - [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - 正規スキーマ定義
> - [data-model.md - Blog Post Entity](./data-model.md#1-blog-post) - エンティティ仕様
> - [research.md - Content Validation: Zod](./research.md#3-content-validation-zod) - Zodが選ばれた理由
>
> **理由**: Astroのコンテンツコレクションは、ビルド時に型安全なフロントマターバリデーションのためにZodを使用します。無効なフロントマターは明確なエラーメッセージでビルド失敗を引き起こし、「fail fast」要件を満たします。

`src/content/config.ts` を作成:

```typescript
import { defineCollection, z } from 'astro:content';

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

### 2. ベースレイアウトの作成

> **設計参照**:
> - [research.md - Theming Strategy](./research.md#4-theming-strategy-css-custom-properties--localstorage) - CSSカスタムプロパティ + localStorageを使う理由
> - [plan.md - Visual Consistency](./plan.md#visual-consistency-) - デザイントークンに関する憲法要件
>
> **理由**: テーマトグルはアプリケーション全体で**唯一**のクライアントサイドJavaScriptです（プログレッシブエンハンスメント）。`is:inline` スクリプトは、ページレンダリング前にテーマを初期化することで、スタイル未適用コンテンツのフラッシュを防ぎます。テーマ設定はlocalStorageでセッション間で永続化されます。

`src/layouts/BaseLayout.astro` を作成:

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="stylesheet" href="/styles/global.css" />
    <script is:inline>
      // テーマ初期化（フラッシュを避けるためページレンダリング前に実行）
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    </script>
  </head>
  <body>
    <header>
      <nav>
        <a href="/">ホーム</a>
        <button id="theme-toggle" aria-label="テーマ切り替え">🌓</button>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>&copy; 2025 あなたの名前. All rights reserved.</p>
    </footer>
    <script>
      // テーマトグルロジック
      const toggle = document.getElementById('theme-toggle');
      toggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.theme = next;
      });
    </script>
  </body>
</html>
```

### 3. ホームページ（記事リスト）の作成

> **設計参照**:
> - [data-model.md - Query Patterns](./data-model.md#build-time-queries-astro) - コンテンツコレクションのクエリ方法
> - [data-model.md - Draft Filtering](./data-model.md#draft-filtering) - ドラフトがクエリフィルタで除外される理由
> - [spec.md - User Story 2](../spec.md#user-story-2---browse-and-navigate-blog-posts-priority-p2) - 時系列ナビゲーション要件
>
> **理由**: 記事は仕様要件に従って日付降順（新しい順）でソートされます。ドラフト記事はファイル除外ではなく、コンテンツコレクションクエリでフィルタリングされます。

`src/pages/index.astro` を作成:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const posts = await getCollection('posts', ({ data }) => !data.draft);
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="私のブログ">
  <h1>ブログ記事</h1>
  <ul class="post-list">
    {sorted.map(post => (
      <li>
        <a href={`/posts/${post.slug}`}>
          <h2>{post.data.title}</h2>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          {post.data.description && <p>{post.data.description}</p>}
        </a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

### 4. 記事ページの作成

> **設計参照**:
> - [data-model.md - Blog Post Schema](./data-model.md#1-blog-post) - エンティティフィールドとバリデーションルール
> - [research.md - URL Structure](./research.md#8-url-structure-postsslug) - `/posts/[slug]` パターンの理由
> - [spec.md - User Story 3](../spec.md#user-story-3---read-posts-in-a-distraction-free-environment-priority-p3) - 読書体験要件
>
> **理由**: Astroの `getStaticPaths()` は、公開されたすべての記事について、ビルド時に静的ページを生成します。slugはランダムな英数字文字列（フロントマターから、または自動生成）で、ファイル名に依存しない安定したパーマリンクを保証します。

`src/pages/posts/[slug].astro` を作成:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <time datetime={post.data.date.toISOString()}>
        {post.data.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      {post.data.tags.length > 0 && (
        <div class="tags">
          {post.data.tags.map(tag => (
            <a href={`/tags/${tag}`}>#{tag}</a>
          ))}
        </div>
      )}
    </header>
    <Content />
  </article>
</BaseLayout>
```

### 5. タグページの作成

> **設計参照**:
> - [data-model.md - Tag Entity](./data-model.md#2-tag) - タグ抽出と関係性
> - [research.md - Tag Pages: Dynamic Routes](./research.md#9-tag-pages-dynamic-routes) - タグページの静的生成
> - [spec.md - User Story 4](../spec.md#user-story-4---organize-posts-by-topic-priority-p4) - タグ組織化要件
>
> **理由**: タグは記事のフロントマターから自動的に検出されます。すべてのタグページは `getStaticPaths()` を使用してビルド時に事前レンダリングされ、静的ファースト・アーキテクチャを維持します。

`src/pages/tags/[tag].astro` を作成:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const tags = [...new Set(posts.flatMap(post => post.data.tags))];

  return tags.map(tag => ({
    params: { tag },
    props: {
      posts: posts
        .filter(p => p.data.tags.includes(tag))
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---

<BaseLayout title={`"${tag}" タグの記事`}>
  <h1>"{tag}" タグの記事</h1>
  <ul class="post-list">
    {posts.map(post => (
      <li>
        <a href={`/posts/${post.slug}`}>
          <h2>{post.data.title}</h2>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </a>
      </li>
    ))}
  </ul>
  <p><a href="/">← すべての記事に戻る</a></p>
</BaseLayout>
```

### 6. グローバルスタイルの追加

> **設計参照**:
> - [research.md - Typography System](./research.md#5-typography-system-system-font-stack--fluid-typography) - システムフォントと流動的スケーリング
> - [research.md - Theming Strategy](./research.md#4-theming-strategy-css-custom-properties--localstorage) - テーマ用CSSカスタムプロパティ
> - [research.md - CSS Strategy](./research.md#2-css-strategy-single-global-stylesheet) - 単一CSSファイルの理由
> - [plan.md - Visual Consistency](./plan.md#visual-consistency-) - CSS変数のデザイントークン（憲法要件）
> - [spec.md - User Story 3](../spec.md#user-story-3---read-posts-in-a-distraction-free-environment-priority-p3) - タイポグラフィと可読性要件
>
> **理由**:
> - **システムフォント**: Webフォントのダウンロード不要、即座のテキストレンダリング（FCP <1.5s要件）
> - **流動的タイポグラフィ**: `clamp()` がメディアクエリなしでレスポンシブスケーリングを提供
> - **CSSカスタムプロパティ**: 憲法により必須、テーマ切り替えを可能にする
> - **65ch measure**: 可読性のための最適行長（仕様に従って50-75文字）

`src/styles/global.css` を作成:

```css
/* CSSカスタムプロパティ（デザイントークン） */
:root {
  --color-text: #1a1a1a;
  --color-bg: #ffffff;
  --color-accent: #0066cc;
  --color-border: #e0e0e0;

  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;

  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --line-height: 1.7;
  --measure: 65ch;
}

[data-theme="dark"] {
  --color-text: #e0e0e0;
  --color-bg: #1a1a1a;
  --color-accent: #4da6ff;
  --color-border: #333333;
}

/* ベーススタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-bg);
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem 1rem;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

/* 記事リスト */
.post-list {
  list-style: none;
}

.post-list li {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.post-list time {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* タグ */
.tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tags a {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
}
```

### 7. Astroの設定

> **設計参照**:
> - [research.md - Syntax Highlighting: Shiki](./research.md#2-syntax-highlighting-shiki) - Shikiの理由（ビルド時、ランタイムコストゼロ）
> - [spec.md - FR-011](../spec.md#functional-requirements) - シンタックスハイライト要件
>
> **理由**: ShikiはAstroに組み込まれており、ビルド時にシンタックスハイライトを実行します（JavaScriptゼロ）。デュアルテーマを使用することで、コードブロックがライト/ダークモードに適応します。

`astro.config.mjs` を更新:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://yourdomain.com',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
```

### 8. サンプル記事の追加

> **設計参照**:
> - [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - 正規フロントマター形式と例
> - [data-model.md - Blog Post Schema](./data-model.md#1-blog-post) - 必須およびオプションフィールド
>
> **理由**: この例は、すべての一般的なフィールドを含むフロントマタースキーマを示しています。フロントマターが無効な場合、スキーマ検証によりビルドが失敗し、コンテンツ品質が保証されます。

`src/content/posts/hello-world.md` を作成:

```markdown
---
title: "Hello World"
date: 2025-12-14
description: "Astroを使った最初のブログ記事です。"
tags: ["meta", "astro"]
draft: false
---

# Hello World

これが最初のブログ記事です！**Astro**を使ってミニマルでコンテンツ重視のブログを構築しています。

## 機能

- 静的サイト生成
- Markdownサポート
- ダークモード
- タグベースの整理

```typescript
// コードブロックの例
const greeting = "Hello, world!";
console.log(greeting);
```
```

## テストセットアップ (10分)

> **📚 設計コンテキスト**: 完全なテスト哲学については [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript) を、憲法との整合性については [plan.md - Minimal Testing](./plan.md#iii-minimal-testing-with-high-value-) を参照してください。

### 1. Vitestの設定

> **設計参照**: [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript)
> **理由**: Vitestはユーザー要件により必須です。Jestより高速で、内部的にVite（Astroのバンドラー）を使用します。

`vitest.config.ts` を作成:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

### 2. テストスクリプトの追加

`package.json` を更新:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

### 3. コンテンツテストの作成

> **設計参照**:
> - [research.md - Test Coverage](./research.md#6-testing-strategy-vitest--typescript) - 何をテストするか、その理由
> - [data-model.md - Validation Rules](./data-model.md#validation-rules) - スキーマ検証の動作
> - [plan.md - Minimal Testing with High Value](./plan.md#iii-minimal-testing-with-high-value-) - 憲法原則
>
> **理由**: これらの統合テストは重要なパスを検証します：スキーマ検証が機能すること、ドラフトが除外されること、フロントマターが正しく解析されること。プレゼンテーションコンポーネントの単体テストはありません（憲法に従って）。

`tests/content.test.ts` を作成:

```typescript
import { getCollection } from 'astro:content';
import { describe, it, expect } from 'vitest';

describe('Content Collections', () => {
  it('公開コレクションからドラフト記事を除外', async () => {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    const hasDrafts = posts.some(post => post.data.draft);
    expect(hasDrafts).toBe(false);
  });

  it('フロントマタースキーマを検証', async () => {
    const posts = await getCollection('posts');
    posts.forEach(post => {
      expect(post.data.title).toBeDefined();
      expect(post.data.date).toBeInstanceOf(Date);
    });
  });
});
```

## CI セットアップ (5分)

> **設計参照**:
> - [research.md - CI/CD Pipeline](./research.md#7-cicd-pipeline-github-actions) - GitHub Actionsの理由とパイプライン設計
> - [plan.md - Fast Feedback Loops](./plan.md#fast-feedback-loops-) - ビルド時間と自動化要件
>
> **理由**: ユーザー要件により、CI で typecheck、lint、build、testの実行が義務付けられています。このパイプラインはマージ前にエラーをキャッチし、mainブランチが常にデプロイ可能であることを保証します（憲法要件）。

`.github/workflows/ci.yml` を作成:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

## ブログの実行

### 開発モード

```bash
npm run dev
# http://localhost:4321 にアクセス
```

### ビルド

```bash
npm run build
# 出力は dist/ ディレクトリ
```

### 本番ビルドのプレビュー

```bash
npm run preview
```

### テストの実行

```bash
npm test
```

## 新規記事の作成

> **設計参照**: [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - すべてのフロントマターフィールドの例とバリデーションルールを参照してください。

1. `src/content/posts/` に新しい `.md` ファイルを作成
2. `title`、`date`（必須）、およびオプションで `description`、`tags`、`draft` を含むフロントマターを追加
3. フロントマターの下にMarkdownでコンテンツを記述
4. ビルドまたは開発サーバーが自動的に新しい記事を認識します

**例**:

```markdown
---
title: "新しい記事"
date: 2025-12-15
description: "記事の簡単な説明。"
tags: ["tutorial", "web"]
---

# 新しい記事

コンテンツをここに...
```

## デプロイ

### 静的ホスティング（Netlify、Vercel、Cloudflare Pages）

すべてのプラットフォームがAstroプロジェクトを自動検出します。手順:

1. Gitリポジトリを接続
2. デプロイ（ビルドコマンド: `npm run build`、出力: `dist/`）

### 手動デプロイ

```bash
npm run build
# dist/ ディレクトリを任意の静的ホストにアップロード
```

## トラブルシューティング

### フロントマターエラーでビルドが失敗する

- すべての記事に必須の `title` と `date` フィールドがあることを確認
- 日付が `YYYY-MM-DD` 形式であることを確認
- フロントマターのYAML構文エラーをチェック

### 記事が表示されない

- `draft: true` が設定されていないかチェック
- ファイルが `src/content/posts/` ディレクトリにあることを確認
- フロントマタースキーマが設定と一致することを確認

### テーマトグルが動作しない

- JavaScriptが有効になっていることを確認
- `theme-toggle` ボタンのIDがスクリプトのセレクタと一致することを確認
- ブラウザコンソールでエラーをチェック

## 次のステップ

1. `src/styles/global.css` でデザインをカスタマイズ
2. `src/content/posts/` に記事を追加
3. `astro.config.mjs` でサイトメタデータを設定
4. ホスティングプラットフォームへのデプロイを設定
5. （オプション）RSSフィード、サイトマップ、その他の機能を追加

## リソース

- [Astro Documentation](https://docs.astro.build/)
- [Content Collections Guide](https://docs.astro.build/en/guides/content-collections/)
- [Markdown Syntax](https://www.markdownguide.org/basic-syntax/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
