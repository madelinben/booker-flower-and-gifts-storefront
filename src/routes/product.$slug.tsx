import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { fetchProduct } from '~/data/Catalog/catalog-actions';
import { pounds } from '~/features/format';
import { addToCart } from '~/stores/cart-store';

export const Route = createFileRoute('/product/$slug')({
  loader: async ({ params }) => {
    const product = await fetchProduct({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? 'Product'} | Booker Flowers & Gifts` }, { name: 'description', content: loaderData?.description ?? '' }] }),
  notFoundComponent: () => <p className="mx-auto max-w-6xl px-4 py-20">That product could not be found. <Link to="/flowers" className="underline">Browse all flowers</Link>.</p>,
  component: Product,
});

function Product() {
  const p = Route.useLoaderData();
  const [variantId, setVariantId] = useState(p.variants[0]?.id);
  const [added, setAdded] = useState(false);
  const variant = p.variants.find((v) => v.id === variantId);
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-3xl object-cover" /> : <div className="bloom aspect-[4/5] rounded-t-[999px] rounded-b-3xl border border-brass/50" role="img" aria-label={`${p.name} (photograph to come)`} />}
      <div>
        <h1 className="text-5xl text-primary">{p.name}</h1>
        <p className="mt-4 text-lg text-muted">{p.description}</p>
        <fieldset className="mt-8"><legend className="text-xs tracking-[0.25em] uppercase">Choose a size</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.variants.map((v) => (
              <label key={v.id} className={`min-h-11 cursor-pointer content-center rounded-full border px-5 text-sm ${v.id === variantId ? 'border-primary bg-primary text-primary-foreground' : 'border-brass'}`}>
                <input type="radio" name="variant" className="sr-only" checked={v.id === variantId} onChange={() => setVariantId(v.id)} />{v.label} · {pounds(v.pricePence)}
              </label>
            ))}
          </div>
        </fieldset>
        <button disabled={!variant} onClick={() => { if (variant) { addToCart({ variantId: variant.id, productName: p.name, label: variant.label, pricePence: variant.pricePence }); setAdded(true); } }}
          className="mt-8 min-h-12 rounded-full bg-accent px-10 text-sm tracking-widest text-white uppercase hover:bg-primary">Add to basket</button>
        {added && <p role="status" className="mt-4 text-sm">Added. <Link to="/cart" className="underline">View basket &amp; choose delivery</Link></p>}
        <p className="mt-8 text-sm text-muted">7-day freshness guarantee · Photo on the doorstep · Delivered by our own vans.</p>
      </div>
    </section>
  );
}
