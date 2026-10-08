export interface Category { slug: string; name: string; kind: 'type' | 'occasion' }
export interface Variant { id: number; label: string; pricePence: number }
export interface Product { slug: string; name: string; description: string; categorySlug: string; imageUrl: string | null; published: boolean; fromPence: number }
export interface ProductDetail extends Product { variants: Variant[] }

interface ProductRow { slug: string; name: string; description: string; category_slug: string; image_url: string | null; published: number; from_pence: number | null }
const toProduct = (r: ProductRow): Product => ({
  slug: r.slug, name: r.name, description: r.description, categorySlug: r.category_slug, imageUrl: r.image_url, published: r.published === 1, fromPence: r.from_pence ?? 0,
});
const SELECT = `SELECT p.slug, p.name, p.description, p.category_slug, p.image_url, p.published,
  (SELECT MIN(price_pence) FROM product_variants v WHERE v.product_slug = p.slug) AS from_pence FROM products p`;

export async function listCategories(db: D1Database): Promise<Category[]> {
  const { results } = await db.prepare('SELECT slug, name, kind FROM categories ORDER BY position, name').all<Category>();
  return results;
}

export async function listProducts(db: D1Database, opts: { category?: string; includeUnpublished?: boolean } = {}): Promise<Product[]> {
  const where: string[] = [];
  const binds: string[] = [];
  if (!opts.includeUnpublished) where.push('p.published = 1');
  if (opts.category) { binds.push(opts.category); where.push(`p.category_slug = ?${binds.length}`); }
  const { results } = await db.prepare(`${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.name`).bind(...binds).all<ProductRow>();
  return results.map(toProduct);
}

export async function getProduct(db: D1Database, slug: string, includeUnpublished = false): Promise<ProductDetail | null> {
  const row = await db.prepare(`${SELECT} WHERE p.slug = ?1`).bind(slug).first<ProductRow>();
  if (!row || (row.published !== 1 && !includeUnpublished)) return null;
  const { results } = await db
    .prepare('SELECT id, label, price_pence FROM product_variants WHERE product_slug = ?1 ORDER BY price_pence')
    .bind(slug)
    .all<{ id: number; label: string; price_pence: number }>();
  return { ...toProduct(row), variants: results.map((v) => ({ id: v.id, label: v.label, pricePence: v.price_pence })) };
}

export interface ProductInput { slug: string; name: string; description: string; categorySlug: string; imageUrl: string | null; published: boolean; variants: { label: string; pricePence: number }[] }

/** Replaces the variant list wholesale; products are small and edited by one or two people. */
export async function saveProduct(db: D1Database, p: ProductInput): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO products (slug, name, description, category_slug, image_url, published) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(slug) DO UPDATE SET name = ?2, description = ?3, category_slug = ?4, image_url = ?5, published = ?6`,
      )
      .bind(p.slug, p.name, p.description, p.categorySlug, p.imageUrl, p.published ? 1 : 0),
    db.prepare('DELETE FROM product_variants WHERE product_slug = ?1').bind(p.slug),
    ...p.variants.map((v) => db.prepare('INSERT INTO product_variants (product_slug, label, price_pence) VALUES (?1, ?2, ?3)').bind(p.slug, v.label, v.pricePence)),
  ]);
}
