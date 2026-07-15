import metadataOverrides from '../data/link-card-metadata.json' with { type: 'json' };

const FETCH_TIMEOUT_MS = 3000;

export default function remarkCardLink() {
  return async (tree) => {
    const cardNodes = [];

    walk(tree, (node, index, parent) => {
      if (!parent || typeof index !== 'number' || !isCardSyntax(node)) {
        return;
      }

      cardNodes.push({ node, index, parent, url: node.children[1].url });
    });

    await Promise.all(
      cardNodes.map(async ({ index, parent, url }) => {
        const metadata = await getCardMetadata(url);
        parent.children[index] = {
          type: 'html',
          value: renderCard(metadata),
        };
      }),
    );
  };
}

function walk(node, visitor, parent = undefined) {
  if (!node || !Array.isArray(node.children)) {
    return;
  }

  node.children.forEach((child, index) => {
    visitor(child, index, node);
    walk(child, visitor, node);
  });
}

function isCardSyntax(node) {
  if (node?.type !== 'paragraph' || node.children?.length !== 2) {
    return false;
  }

  const [prefix, link] = node.children;
  return (
    prefix.type === 'text' &&
    prefix.value === '@' &&
    link.type === 'link' &&
    link.children?.length === 1 &&
    link.children[0].type === 'text' &&
    link.children[0].value === 'card' &&
    typeof link.url === 'string' &&
    /^https?:\/\//.test(link.url)
  );
}

async function getCardMetadata(url) {
  const parsedUrl = new URL(url);
  const fallback = {
    url,
    title: parsedUrl.hostname,
    description: url,
    image: '',
    siteName: parsedUrl.hostname.replace(/^www\./, ''),
  };
  const override = metadataOverrides[url];

  if (override) {
    return {
      ...fallback,
      ...override,
      image: absolutizeUrl(override.image || '', url),
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; king3326-blog-card/1.0)',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return fallback;
    }

    const html = await response.text();
    const title =
      pickMeta(html, ['og:title', 'twitter:title']) ||
      pickTitle(html) ||
      fallback.title;
    const description =
      pickMeta(html, ['og:description', 'twitter:description', 'description']) ||
      fallback.description;
    const image = absolutizeUrl(
      pickMeta(html, ['og:image', 'twitter:image']),
      url,
    );
    const siteName = pickMeta(html, ['og:site_name']) || fallback.siteName;

    return { url, title, description, image, siteName };
  } catch {
    return fallback;
  }
}

function pickMeta(html, names) {
  for (const name of names) {
    const value = findMetaContent(html, 'property', name) || findMetaContent(html, 'name', name);
    if (value) {
      return decodeEntities(value.trim());
    }
  }

  return '';
}

function findMetaContent(html, attrName, attrValue) {
  const metaPattern = /<meta\b[^>]*>/gi;
  const attrPattern = new RegExp(`${attrName}\\s*=\\s*["']${escapeRegExp(attrValue)}["']`, 'i');

  for (const match of html.matchAll(metaPattern)) {
    const tag = match[0];
    if (!attrPattern.test(tag)) {
      continue;
    }

    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (content?.[1]) {
      return content[1];
    }
  }

  return '';
}

function pickTitle(html) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeEntities(title.trim()) : '';
}

function absolutizeUrl(value, baseUrl) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function renderCard({ url, title, description, image, siteName }) {
  const safeUrl = escapeHtml(url);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeSiteName = escapeHtml(siteName);
  const host = escapeHtml(new URL(url).hostname.replace(/^www\./, ''));
  const thumbnail = image
    ? `<span class="blog-link-card__thumbnail"><img class="blog-link-card__image" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" /></span>`
    : `<span class="blog-link-card__thumbnail blog-link-card__thumbnail--fallback"><span>${host}</span></span>`;

  return `<a class="blog-link-card not-prose" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
  <span class="blog-link-card__body">
    <span class="blog-link-card__title">${safeTitle}</span>
    <span class="blog-link-card__description">${safeDescription}</span>
    <span class="blog-link-card__meta">${safeSiteName}</span>
  </span>
  ${thumbnail}
</a>`;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
