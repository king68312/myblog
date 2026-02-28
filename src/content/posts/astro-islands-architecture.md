---
title: "Astro の Islands Architecture を理解する"
description: "Astro の核心概念である Islands Architecture について、なぜゼロJSがデフォルトなのか、どのように動くのかを解説します。"
pubDate: 2026-02-28
tags: ["tech", "Astro", "フロントエンド"]
draft: false
---

## Islands Architecture とは

Astro が採用している **Islands Architecture（アイランドアーキテクチャ）** は、2019年にEtsy のフロントエンドアーキテクトである Katie Sylor-Miller が提唱した概念です。

## 従来のSSRとの違い

従来のSSRフレームワーク（Next.js など）は、ページ全体をJavaScriptで「ハイドレーション」します。

```
[HTML] → [JS ダウンロード] → [全ページをハイドレーション]
```

これは静的なコンテンツ（記事本文など）にも無駄なJSが走ることを意味します。

## Astroのアプローチ

Astroでは、**インタラクティブなUI部分だけを「島（Island）」として扱い**、そこだけJSを読み込みます。

```
[HTML] → [静的部分はそのまま] → [Islandだけハイドレーション]
```

```astro
---
// サーバーサイドのみ実行（JSなし）
import StaticHeader from './StaticHeader.astro';
// Islandとして扱う（JSあり）
import InteractiveCounter from './Counter.jsx';
---

<StaticHeader />
<!-- client:load でIslandとして動作 -->
<InteractiveCounter client:load />
```

## client:* ディレクティブ

| ディレクティブ | 説明 |
|---|---|
| `client:load` | ページロード時に即座にハイドレーション |
| `client:idle` | ブラウザがアイドル状態になったら |
| `client:visible` | 要素がビューポートに入ったら |
| `client:only` | サーバーレンダリングなし、クライアントのみ |

## ブログに最適な理由

このブログのような**読み物中心のサイト**は、ほとんどのコンテンツがインタラクティブでない静的なHTMLです。

Astroを使うと、記事本文のJSゼロを実現しつつ、必要な部分（例：コードのシンタックスハイライト、検索機能など）だけをIslandとして追加できます。

実際にこのブログもほぼJSなしで動いています。
