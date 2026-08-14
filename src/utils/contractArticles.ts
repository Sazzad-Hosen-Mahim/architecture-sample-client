/**
 * Identifying the "core" contract articles.
 *
 * Articles 1–3 are rendered specially everywhere a contract is shown: Article 2
 * gets the proposal's service scope appended, Article 3 gets the generated fee
 * table. Everything after that is plain text straight from the master contract.
 *
 * Matching on title substrings is unsafe — a PM can retitle Article 4 to
 * "Scope Changes & Additional Services", and a naive `title.includes("scope")`
 * then swallows it into Article 2's slot. The article *number* is the stable
 * identity, so that's what these helpers key off.
 */

interface ArticleLike {
  articleKey?: string | null;
  title?: string | null;
}

/**
 * The article's number — 2 for "article_2_scope" / "Article 2 - Scope of
 * Services". Returns null for anything unnumbered (e.g. "Exhibit A"), which is
 * always rendered as a plain trailing section.
 */
export function getArticleNumber(article: ArticleLike): number | null {
  // Master contract keys read "article_2_scope"; amendment keys carry a prefix,
  // "amendment_article_2". Both are matched here.
  const fromKey = /(?:^|_)article[_-](\d+)/i.exec(
    (article.articleKey || "").trim()
  );
  if (fromKey) return Number(fromKey[1]);

  const fromTitle = /^\s*article\s+(\d+)/i.exec(article.title || "");
  return fromTitle ? Number(fromTitle[1]) : null;
}

/** Article 2 — the scope section the selected services are listed under. */
export function isScopeArticle(article: ArticleLike): boolean {
  return getArticleNumber(article) === 2;
}

/** Article 3 — the payment section the generated fee table sits in. */
export function isPaymentArticle(article: ArticleLike): boolean {
  return getArticleNumber(article) === 3;
}

/**
 * Articles 1–3, which every view renders in its own hand-built block. The rest
 * are listed generically after them.
 */
export function isCoreArticle(article: ArticleLike): boolean {
  const n = getArticleNumber(article);
  return n !== null && n <= 3;
}
