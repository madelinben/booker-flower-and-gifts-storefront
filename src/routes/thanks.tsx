import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { clearCart } from '~/stores/cart-store';

export const Route = createFileRoute('/thanks')({ head: () => ({ meta: [{ title: 'Thank you | Booker Flowers & Gifts' }, { name: 'robots', content: 'noindex' }] }), component: Thanks });

function Thanks() {
  useEffect(clearCart, []);
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-5xl text-primary">Thank you</h1>
      <p className="mt-4 text-lg text-muted">Your order is in. We’ll email you when it’s out for delivery and again, with a photo, when it arrives.</p>
      <Link to="/flowers" className="mt-8 inline-block min-h-11 content-center rounded-full border border-brass px-8 text-sm tracking-widest uppercase hover:border-accent">Keep browsing</Link>
    </section>
  );
}
