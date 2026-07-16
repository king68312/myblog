import { visit } from 'unist-util-visit';

export function remarkTwitterCard() {
  return async (tree) => {
    const promises = [];

    visit(tree, 'paragraph', (node, index, parent) => {
      // 箇条書きや他の要素ではなく、単一のリンク行 `@ [card](url)` を探す
      if (node.children.length === 1 && node.children[0].type === 'link') {
        const linkNode = node.children[0];
        const url = linkNode.url;

        // X / Twitter のURLの場合
        if (url.startsWith('https://x.com/') || url.startsWith('https://twitter.com/')) {
          const base = "https://publish.twitter.com/oembed";
          const fetchUrl = `${base}?url=${encodeURIComponent(url)}&omit_script=true`;

          const promise = fetch(fetchUrl)
            .then(res => res.json())
            .then(data => {
              // 取得したHTMLに置換する（HTMLノードとしてパースさせる）
              node.type = 'html';
              node.value = `
                <div class="tweet-container" style="margin: 2rem auto; max-width: 550px; width: 100%;">
                  ${data.html}
                  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8" crossorigin="anonymous" is:inline></script>
                </div>
              `;
            })
            .catch(err => {
              console.error(`Failed to fetch tweet: ${url}`, err);
              // 失敗した場合は通常のリンクに戻す
            });

          promises.push(promise);
        } 
        // fortee.jp などの一般リンクの場合（必要であれば簡易なブログカードに変換可能）
        else if (url.startsWith('https://fortee.jp/')) {
          node.type = 'html';
          node.value = `
            <div class="link-card" style="margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block;">
                <div style="font-weight: bold; margin-bottom: 0.5rem;">${linkNode.children[0]?.value || url}</div>
                <div style="font-size: 0.85rem; color: #64748b;">${url}</div>
              </a>
            </div>
          `;
        }
      }
    });

    // 非同期のfetchがすべて完了するのを待つ
    await Promise.all(promises);
  };
}
