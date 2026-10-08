import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { startCheckout } from '~/data/Order/checkout-actions';
import { DELIVERY_SLOTS, isDeliverablePostcode, SLOT_FEE_PENCE, SLOT_LABEL } from '~/domain/delivery/delivery-rules';
import { pounds, todayIso } from '~/features/format';
import { $cart, setQuantity } from '~/stores/cart-store';

export const Route = createFileRoute('/cart')({ head: () => ({ meta: [{ title: 'Basket | Booker Flowers & Gifts' }, { name: 'robots', content: 'noindex' }] }), component: Cart });

function Cart() {
  const cart = useStore($cart);
  const [slot, setSlot] = useState<(typeof DELIVERY_SLOTS)[number]>('standard');
  const [postcode, setPostcode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const subtotal = cart.reduce((s, l) => s + l.pricePence * l.quantity, 0);
  const field = 'mt-1 block w-full min-h-10 rounded border border-border bg-white px-3';
  const postcodeBad = postcode.length >= 5 && !isDeliverablePostcode(postcode);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? '');
    setBusy(true);
    setError('');
    try {
      const res = await startCheckout({ data: {
        lines: cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        customerEmail: s('customerEmail'), recipientName: s('recipientName'), recipientPhone: s('recipientPhone'),
        addressLine1: s('addressLine1'), addressLine2: s('addressLine2'), postcode, deliveryDate: s('deliveryDate'), slot, giftMessage: s('giftMessage'),
      } });
      if ('url' in res && res.url) window.location.assign(res.url);
      else setError('error' in res && res.error ? res.error : 'Could not start checkout.');
    } catch {
      setError('Something went wrong starting checkout. Please try again or call 0151 724 4850.');
    } finally {
      setBusy(false);
    }
  }

  if (cart.length === 0) return <p className="mx-auto max-w-6xl px-4 py-20 text-lg">Your basket is empty. <a href="/flowers" className="underline">Browse flowers</a>.</p>;
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-10 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <h1 className="text-5xl text-primary">Your basket</h1>
        <ul className="mt-6 divide-y divide-border">
          {cart.map((l) => (
            <li key={l.variantId} className="flex items-center justify-between gap-4 py-4">
              <span>{l.productName}<span className="block text-sm text-muted">{l.label} · {pounds(l.pricePence)}</span></span>
              <label className="text-sm">Qty <input type="number" min={0} max={20} value={l.quantity} onChange={(e) => setQuantity(l.variantId, Number(e.target.value))} className="ml-1 min-h-10 w-16 rounded border border-border bg-white px-2" /></label>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Flowers</dt><dd>{pounds(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{SLOT_LABEL[slot]} delivery</dt><dd>{pounds(SLOT_FEE_PENCE[slot])}</dd></div>
          <div className="flex justify-between border-t border-brass pt-2 font-display text-2xl text-primary"><dt>Total</dt><dd>{pounds(subtotal + SLOT_FEE_PENCE[slot])}</dd></div>
        </dl>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brass/60 bg-white/60 p-6 lg:col-span-3">
        <h2 className="text-3xl text-primary">Delivery details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Recipient name<input name="recipientName" required autoComplete="off" className={field} /></label>
          <label className="text-sm">Recipient phone<input name="recipientPhone" type="tel" autoComplete="off" className={field} /></label>
          <label className="text-sm sm:col-span-2">Address line 1<input name="addressLine1" required className={field} /></label>
          <label className="text-sm">Address line 2<input name="addressLine2" className={field} /></label>
          <label className="text-sm">Postcode<input value={postcode} onChange={(e) => setPostcode(e.target.value)} required aria-invalid={postcodeBad} className={field} />
            {postcodeBad && <span role="alert" className="text-accent">We deliver to Liverpool postcodes L1–L8, L11–L19, L24–L28, L36 and L70.</span>}</label>
        </div>
        <fieldset><legend className="text-sm">Delivery option</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {DELIVERY_SLOTS.map((s) => (
              <label key={s} className={`cursor-pointer rounded-xl border p-3 text-sm ${s === slot ? 'border-primary bg-blush/60' : 'border-border'}`}>
                <input type="radio" name="slot" className="sr-only" checked={s === slot} onChange={() => setSlot(s)} />
                <span className="block font-display text-xl">{SLOT_LABEL[s]}</span>{pounds(SLOT_FEE_PENCE[s])}{s === 'same_day' && ' · order by 2pm, today only'}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">Delivery date<input name="deliveryDate" type="date" required min={todayIso()} defaultValue={todayIso()} className={field} /></label>
        <label className="block text-sm">Gift message<textarea name="giftMessage" rows={3} maxLength={300} className={field} /></label>
        <label className="block text-sm">Your email (for order updates)<input name="customerEmail" type="email" required className={field} /></label>
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <button disabled={busy || postcodeBad} className="min-h-12 rounded-full bg-accent px-10 text-sm tracking-widest text-white uppercase hover:bg-primary disabled:opacity-50">{busy ? 'Starting checkout…' : 'Pay securely with Stripe'}</button>
      </form>
    </section>
  );
}
