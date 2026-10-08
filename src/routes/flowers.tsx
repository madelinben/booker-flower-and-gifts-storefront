import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { fetchCategories, fetchProducts } from '~/data/Catalog/catalog-actions';
import { ProductCard } from '~/features/ProductCard';

export const Route = createFileRoute('/flowers')({
  validateSearch: z.object({ category: z.string().optional() }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => ({ products: await fetchProducts({ data: deps }), categories: await fetchCategories() }),
  head: () => ({ meta: [{ title: 'Flowers & gifts | Booker Flowers & Gifts' }, { name: 'description', content: 'Hand-tied bouquets, arrangements, hampers and sympathy flowers, delivered across Liverpool by our own vans.' }] }),
  component: Flowers,
});

function Flowers() {
  const { products, categories } = Route.useLoaderData();
  const { category } = Route.useSearch();
  const chip = 'inline-block min-h-10 content-center rounded-full border border-brass px-5 text-sm hover:border-accent hover:text-accent';
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-5xl text-primary">{categories.find((c) => c.slug === category)?.name ?? 'All flowers & gifts'}</h1>
      <ul className="mt-6 flex flex-wrap gap-3">
        <li><Link to="/flowers" search={{}} className={chip} activeOptions={{ includeSearch: true }} activeProps={{ className: 'bg-primary text-primary-foreground' }}>All</Link></li>
        {categories.map((c) => <li key={c.slug}><Link to="/flowers" search={{ category: c.slug }} className={chip} activeOptions={{ includeSearch: true }} activeProps={{ className: 'bg-primary text-primary-foreground' }}>{c.name}</Link></li>)}
      </ul>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => <li key={p.slug}><ProductCard product={p} /></li>)}
        {products.length === 0 && <li className="text-muted">Nothing here yet — call us on 0151 724 4850 and we’ll make it for you.</li>}
      </ul>
    </section>
  );
}
