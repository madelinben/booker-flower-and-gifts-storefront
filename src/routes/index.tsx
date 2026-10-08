import { createFileRoute, Link } from '@tanstack/react-router';
import { fetchCategories, fetchProducts } from '~/data/Catalog/catalog-actions';
import { ProductCard } from '~/features/ProductCard';
import { Ladybird } from '~/components/Ladybird';

export const Route = createFileRoute('/')({
  loader: async () => ({ products: (await fetchProducts({ data: {} })).slice(0, 3), categories: await fetchCategories() }),
  component: Home,
});

function Home() {
  const { products, categories } = Route.useLoaderData();
  const types = categories.filter((c) => c.kind === 'type').slice(0, 4);
  const occasions = categories.filter((c) => c.kind === 'occasion');
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">Award-winning Allerton florist</p>
          <h1 className="mt-5 text-5xl text-primary md:text-7xl">Flowers arranged by hand, <em className="text-rose">delivered by us.</em></h1>
          <p className="mt-6 max-w-md text-lg text-muted">Seasonal bouquets and gifts, made in our Liverpool studio and hand-delivered in our own vans — with a photograph on the doorstep.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/flowers" search={{}} className="min-h-11 content-center rounded-full bg-primary px-8 text-sm tracking-widest text-primary-foreground uppercase hover:bg-accent">Shop flowers</Link>
            <Link to="/delivery" className="min-h-11 content-center rounded-full border border-brass px-8 text-sm tracking-widest uppercase hover:border-accent hover:text-accent">Delivery details</Link>
          </div>
        </div>
        <div className="relative">
          <div className="bloom aspect-[4/5] rounded-t-[999px] rounded-b-3xl border border-brass/50" role="img" aria-label="Illustration of a soft pink and sage bouquet (photograph to come)" />
          <Ladybird className="ladybird absolute -top-3 right-[18%] size-14 rotate-[18deg]" />
        </div>
      </section>

      <section id="flowers" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-4xl text-primary">Shop by style</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((c) => (
            <li key={c.slug}>
              <Link to="/flowers" search={{ category: c.slug }} className="lift block rounded-2xl border border-border bg-white/60 p-6">
                <span className="bloom block aspect-square rounded-xl" aria-hidden />
                <span className="mt-4 block font-display text-2xl text-primary">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="flex items-end justify-between border-b hairline pb-3">
          <h2 className="text-4xl text-primary">This week’s favourites</h2>
          <Link to="/flowers" search={{}} className="text-sm tracking-widest uppercase hover:text-accent">View all</Link>
        </div>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {products.map((p) => <li key={p.slug}><ProductCard product={p} /></li>)}
        </ul>
      </section>

      <div className="mx-auto mt-20 flex max-w-6xl items-center gap-4 px-4" aria-hidden>
        <span className="h-px flex-1 bg-brass/60" /><Ladybird className="size-8" /><span className="h-px flex-1 bg-brass/60" />
      </div>

      <section id="occasions" className="mt-8 bg-blush/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl text-primary">For every occasion</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {occasions.map((o) => <li key={o.slug}><Link to="/flowers" search={{ category: o.slug }} className="inline-block min-h-10 content-center rounded-full border border-brass bg-background px-5 text-sm hover:border-accent hover:text-accent">{o.name}</Link></li>)}
          </ul>
        </div>
      </section>

      <section id="delivery" className="mx-auto mt-20 grid max-w-6xl gap-10 px-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-4xl text-primary">Our own vans, your doorstep</h2>
          <p className="mt-4 text-muted">No couriers. Our drivers deliver across Liverpool and send you a photo when your flowers arrive.</p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-3 md:col-span-2">
          {[['Standard', '£7.50'], ['Same day · order by 2pm', '£10'], ['Guaranteed morning', '£12.50']].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-brass/60 p-6">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="mt-2 font-display text-4xl text-primary">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="flower-school" className="mx-auto mt-20 max-w-6xl px-4">
        <div className="rounded-3xl bg-primary px-8 py-14 text-primary-foreground md:px-16">
          <p className="text-xs tracking-[0.3em] text-brass uppercase">Flower school</p>
          <h2 className="mt-3 max-w-xl text-4xl md:text-5xl">Learn to arrange with our florists</h2>
          <p className="mt-4 max-w-lg text-sage">Hands-on classes and workshops, in the studio or online — from hand-tied bouquets to flower crowns.</p>
        </div>
      </section>
    </>
  );
}
