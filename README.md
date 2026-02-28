# myblog

`king3326.dev/blog` で動いている自作ブログ。
Astro + Tailwind CSS + Cloudflare Workers で構築。

## 全体構成

```
king3326.dev        → ポートフォリオ (別リポジトリ: mywebsite)
king3326.dev/blog   → このブログ (myblog)
```

Cloudflare の Worker Route `king3326.dev/blog*` が、このリポジトリのWorkerへリクエストを転送している。

---

## ディレクトリ構成

```
myblog/
├── src/
│   ├── content/
│   │   ├── config.ts          # 記事スキーマの定義（frontmatterの型）
│   │   └── posts/             # ★ここに記事のMarkdownファイルを置く
│   │       ├── hello-world.md
│   │       └── ...
│   ├── components/
│   │   ├── PostCard.astro     # 記事一覧に表示されるカード
│   │   └── TagBadge.astro     # タグのバッジ（#tech など）
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 全ページ共通レイアウト（ヘッダー・フッター・OGP）
│   │   └── PostLayout.astro   # 記事詳細ページのレイアウト
│   ├── pages/
│   │   ├── index.astro        # 記事一覧ページ (/blog/)
│   │   ├── [slug].astro       # 記事詳細ページ (/blog/記事名/)
│   │   └── tags/
│   │       ├── index.astro    # タグ一覧ページ (/blog/tags/)
│   │       └── [tag].astro    # タグ別記事一覧 (/blog/tags/タグ名/)
│   └── styles/
│       └── global.css         # グローバルCSS（Tailwindのimport）
├── public/
│   └── .assetsignore          # Cloudflare Workersのアセット除外設定
├── astro.config.mjs            # Astroの設定ファイル
├── wrangler.jsonc              # Cloudflare Workersの設定ファイル
└── package.json
```

---

## 記事を追加する方法

### 1. Markdownファイルを作成

`src/content/posts/` の中に `.md` ファイルを作成する。
ファイル名がそのままURLのslugになる（例: `my-first-post.md` → `/blog/my-first-post`）。

### 2. frontmatterを書く

ファイルの先頭に以下の形式で記事情報を記述する。

```markdown
---
title: "記事のタイトル"
description: "記事の概要（一覧ページやOGPに使われる）"
pubDate: 2026-03-01
tags: ["tech", "Astro"]
draft: false
---

ここから本文を書く。

## 見出し

通常のMarkdown記法がすべて使える。
```

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `title` | ✅ | 記事タイトル |
| `description` | ✅ | 記事の概要 |
| `pubDate` | ✅ | 公開日（YYYY-MM-DD形式） |
| `tags` | | タグの配列。省略すると空になる |
| `draft` | | `true` にすると一覧に表示されない |

### 3. デプロイ

GitHubにpushするだけで自動デプロイされる。

```bash
git add src/content/posts/新しい記事.md
git commit -m "add: 新しい記事"
git push
```

---

## よくある修正箇所

### ヘッダー・フッターを変えたい
→ `src/layouts/BaseLayout.astro`

### 記事カードのデザインを変えたい
→ `src/components/PostCard.astro`

### 記事本文のスタイルを変えたい
→ `src/layouts/PostLayout.astro` の `prose` クラス周辺

### サイトのベースURL（/blog）を変えたい
→ `astro.config.mjs` の `base: '/blog'`

### OGP（SNSシェア時のサムネイル情報）を変えたい
→ `src/layouts/BaseLayout.astro` の `<head>` 内

---

## ローカルで動かす

```bash
# 依存パッケージのインストール（初回のみ）
npm install

# 開発サーバー起動 → http://localhost:4321/blog/ で確認できる
npm run dev

# 本番ビルド（distディレクトリに出力）
npm run build
```

---

## 技術スタック

| 技術 | 役割 | ドキュメント |
| --- | --- | --- |
| Astro | フレームワーク | https://docs.astro.build |
| Tailwind CSS v4 | スタイリング | https://tailwindcss.com/docs |
| @tailwindcss/typography | 記事本文のスタイル（proseクラス） | https://github.com/tailwindlabs/tailwindcss-typography |
| Astro Content Collections | 型安全なMarkdown管理 | https://docs.astro.build/en/guides/content-collections/ |
| Cloudflare Workers | ホスティング | https://developers.cloudflare.com/workers/ |
| Wrangler | Cloudflareのデプロイツール | https://developers.cloudflare.com/workers/wrangler/ |

---

## デプロイの仕組み

```
git push
  └→ Cloudflare Pages がビルドを検知
       └→ npm run build（astro build + dist/.assetsignore と dist/_redirects を生成）
            └→ wrangler deploy（Cloudflare Workers にデプロイ）
```

**Worker Route の設定（Cloudflareダッシュボード）**
- `king3326.dev/blog*` → `myblog` Worker

この設定により、ポートフォリオ（`king3326.dev`）とブログ（`king3326.dev/blog`）が共存している。
