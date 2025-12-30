# Tag Structure Decision Log

**Date**: 2025-12-18  
**Status**: DECIDED  
**Decision**: Content Tag + Meta Tag の2軸分離モデルを採用

---

## TL;DR

タグを2種類に分ける：

- **Content Tag**：階層あり（`tech/astro/ssg`）
- **Meta Tag**：フラット（`tools`, `productivity`）

frontmatter で明示的に分離：

```yaml
category: tech
tags:
  - tech/astro/tutorial
  - tech/typescript
meta:
  - tools
  - productivity
```

---

## 背景：何が問題だったか

### 初期の課題

タグポリシーで「カテゴリをまたぐ関連付けは行わない」と定義したが、現実的に以下のケースが想定された：

1. **技術 × 応用分野**
   - 「Astroで音楽プレイヤーを作る」
   - tech 側からも music 側からも見つかるべき

2. **ツール × 使用文脈**
   - 「Obsidianで作曲メモを管理」
   - tech/tools と music/workflow の両方に関連

3. **横断的な概念**
   - 「コーディング中の集中力を高めるBGM選び」
   - tech, music, life すべてに関連性がある

### 本質的な要求

記事には**2つの軸**がある：

- **Content軸**：「何について書いているか」（tech, music, life）
- **Meta軸**：「どんな視点で書いているか」（tools, productivity, tutorial）

この2軸を、**シンプルに・機械処理可能に・明示的に**表現したい。

---

## 検討した案

### 戦略A：Primary Category制

```yaml
category: tech # Primary
tags:
  - tech/astro/tutorial
  - music/tools/web-player # 別カテゴリ参照OK
```

**拒絶理由**：

- 記事の「所属」が1カテゴリに固定される
- `music/tools/web-player` タグは付いているが、記事自体は tech に**分離されてしまう**
- 横断的テーマを正式にサポートできない
- 「参照タグ」という曖昧な概念が生まれる

**ノックアウトポイント**：

> 確実に横断的テーマのタグが欲しくなる。それを「参照」という副次的な扱いにするのは本質的に間違っている。

---

### アイディア2：Prefix分離（`meta/` prefix）

```yaml
tags:
  - tech/astro/tutorial
  - meta/tools
  - meta/productivity
```

**拒絶理由**：

- 階層タグの世界に `meta` という特別扱いのルールを紛れ込ませている
- `meta/tools/web` のような階層が生まれる可能性
- 「カテゴリ」の定義が曖昧になる（meta はカテゴリか？）
- 気持ち悪い

**ノックアウトポイント**：

> 階層構造のルールに特殊ケースを混ぜるのは美しくない。メタタグは別の種類のものとして扱うべき。

---

### アイディア3：Single-Word Tag Rule（暗黙的判定）

```yaml
tags:
  - tech/astro/tutorial # スラッシュあり → Content
  - tools # スラッシュなし → Meta
  - productivity
```

**拒絶理由**：

- **暗黙的すぎる**
- スラッシュの有無だけで種類が決まるのは、読んだ人に伝わらない
- `life` のような1階層タグがあったらどうなる？
- 実装はシンプルだが、**意図が不明確**

**ノックアウトポイント**：

> ルールとしてシンプルなのは良いが、「なぜこのタグが1単語なのか」の意図が frontmatter から読み取れない。暗黙的すぎる。

---

### アイディア4：Hashtag風記法

```yaml
tags:
  - tech/astro/tutorial
  - "#tools"
  - "#productivity"
```

**拒絶理由**：

- タグ名に `#` が入るのは扱いづらい
- URL で `%23` になる
- Obsidian との連携で問題が出そう
- 見た目はわかりやすいが、実装上の懸念が大きい

---

## 採用：アイディア1（明示的分離）

```yaml
category: tech
tags:
  - tech/astro/tutorial
  - tech/typescript
meta:
  - tools
  - productivity
  - tutorial
```

### 採用理由

1. **最もシンプル**
   - 2つのリストを持つだけ
   - 新しい複雑なルールなし

2. **明示的**
   - `meta:` と書いてあるので、意図が明確
   - 読む人が迷わない

3. **完全に独立**
   - Content Tag と Meta Tag が混ざらない
   - それぞれに独自のルールを適用できる

4. **拡張性**
   - 将来的に `links:` とか追加できる
   - frontmatter の構造として自然

5. **機械処理容易**
   - フィールドを見るだけで判定可能
   - 暗黙的な変換不要

---

## ルール定義

### Content Tag（階層タグ）

- `tags:` フィールドに記述
- スラッシュ `/` で階層を表現
- 既存のタグポリシーに従う
- 自動展開：`tech/astro/ssg` → `tech`, `tech/astro`, `tech/astro/ssg`

### Meta Tag（横断タグ）

- `meta:` フィールドに記述
- **階層なし・単語のみ**
- 複数カテゴリにまたがる横断的テーマを表現
- 命名規則：英語小文字、ハイフン区切り（Content Tag と同じ）
- 展開なし：そのまま1ノード

### 制約

- `category` は必須（1つ）
- `tags` は最大5個
- `meta` は最大5個（暫定）
- Content Tag + Meta Tag の合計で記事の「視点」を表現

### 例

```yaml
---
category: tech
title: "Astroで音楽プレイヤーを作る"
date: 2025-12-18
tags:
  - tech/astro/ssg
  - tech/typescript
  - music/tools/player
meta:
  - tools
  - tutorial
  - creative-coding
---
```

この記事は：

- **Content的には**：tech カテゴリで、Astro と TypeScript について、音楽ツールの文脈でも読める
- **Meta的には**：ツール紹介であり、チュートリアルであり、クリエイティブコーディングの事例

---

## 実装上の注意

### Obsidian との関係

**重要**：このフォーマットは「最終的な形」であり、Obsidian 上の記述そのものではない。

現在の想定：

```
Obsidian側のタグ → 変換処理 → この形式
```

Obsidian の frontmatter 周りは仕様が変わりつつあるため、**変換ロジックの詳細は後で決める**。

保証すべきは：

- ビルド時には必ずこの形になっている
- 変換ロジックは完全自動（人間の判断不要）

---

## タグノード生成

### Content Tag の展開

```typescript
'tech/astro/ssg' → ['tech', 'tech/astro', 'tech/astro/ssg']
```

### Meta Tag はそのまま

```typescript
'tools' → ['tools']
```

### 最終的なタグノード例

```typescript
{
  // Content nodes
  "tech": { type: "content", depth: 1, articleIds: [...] },
  "tech/astro": { type: "content", depth: 2, articleIds: [...] },
  "tech/astro/ssg": { type: "content", depth: 3, articleIds: [...] },

  // Meta nodes
  "tools": { type: "meta", articleIds: [...] },
  "productivity": { type: "meta", articleIds: [...] }
}
```

---

## UI 表示のイメージ

### 記事ページ

```
カテゴリ：Tech > Astro > SSG
テーマ：🏷️ tools, tutorial, creative-coding
```

### タグ一覧ページ

```
【カテゴリ別】
tech/
  astro/
    ssg (5)
    tutorial (3)
music/
  tools/
    player (2)

【横断テーマ】
tools (20)
tutorial (15)
productivity (12)
creative-coding (8)
```

---

## まとめ

- **Content Tag**：何について書いているか（階層あり）
- **Meta Tag**：どんな視点で書いているか（フラット）
- 2つを明示的に分離することで、シンプルさと表現力を両立
- 完全機械処理を維持
- Obsidian との連携は変換層で吸収
