import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { fetchAdminProduct, fetchAdminProducts, fetchCategories, saveAdminProduct } from '~/data/Catalog/catalog-actions';
import { pounds } from '~/features/format';

export const Route = createFileRoute('/admin/products')({
  loader: async () => ({ products: await fetchAdminProducts(), categories: await fetchCategories() }),
  component: Products,
});

const blank = { slug: '', name: '', description: '', categorySlug: 'hand-tied', imageUrl: '', published: true, variants: 'Standard:55.00' };

function Products() {
  const { products, categories } = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  async function edit(slug: string) {
    const p = await fetchAdminProduct({ data: { slug } });
    if (p) setForm({ ...p, imageUrl: p.imageUrl ?? '', variants: p.variants.map((v) => `${v.label}:${(v.pricePence / 100).toFixed(2)}`).join('\n') });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const variants = form.variants.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [label, price] = l.split(':');
        return { label: label.trim(), pricePence: Math.round(Number(price) * 100) };
      });
      await saveAdminProduct({ data: { ...form, imageUrl: form.imageUrl || null, variants } });
      setForm(blank);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    }
  }
  const field = 'mt-1 block w-full min-h-10 rounded border border-border bg-white px-3';
  return (
    <section className="mt-6 grid gap-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl text-primary">Products</h1>
        <ul className="mt-4 divide-y divide-border">
          {products.map((p) => (
            <li key={p.slug} className="flex items-center justify-between py-3">
              <span>{p.name} <span className="text-sm text-muted">from {pounds(p.fromPence)}{!p.published && ' · hidden'}</span></span>
              <button className="min-h-10 text-sm underline" onClick={() => void edit(p.slug)}>Edit</button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-brass/60 bg-white/60 p-6">
        <h2 className="text-2xl text-primary">{form.slug ? 'Edit / add product' : 'New product'}</h2>
        <label className="block text-sm">Slug<input className={field} required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className="block text-sm">Name<input className={field} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block text-sm">Description<textarea className={field} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label className="block text-sm">Category<select className={field} value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label className="block text-sm">Image URL<input className={field} type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></label>
        <label className="block text-sm">Variants (Label:price per line)<textarea className={`${field} font-mono`} rows={3} value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <button className="min-h-11 rounded-full bg-primary px-6 text-sm text-primary-foreground">Save product</button>
      </form>
    </section>
  );
}
