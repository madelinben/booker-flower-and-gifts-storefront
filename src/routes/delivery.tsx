import { createFileRoute } from '@tanstack/react-router';
import { SLOT_FEE_PENCE, SLOT_LABEL } from '~/domain/delivery/delivery-rules';
import { pounds } from '~/features/format';

export const Route = createFileRoute('/delivery')({
  head: () => ({ meta: [{ title: 'Delivery information | Booker Flowers & Gifts' }, { name: 'description', content: 'Our own vans deliver across Liverpool postcodes. Order before 2pm for same-day delivery, Monday to Saturday.' }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-5xl text-primary">Delivery information</h1>
      <p className="mt-4 text-lg text-muted">We don’t use couriers. Our own drivers deliver your flowers and send you a photograph when they arrive.</p>
      <ul className="mt-8 divide-y divide-border">
        {(Object.keys(SLOT_FEE_PENCE) as (keyof typeof SLOT_FEE_PENCE)[]).map((s) => <li key={s} className="flex justify-between py-3"><span>{SLOT_LABEL[s]}{s === 'same_day' && ' (order before 2pm, Mon–Sat)'}</span><strong>{pounds(SLOT_FEE_PENCE[s])}</strong></li>)}
      </ul>
      <h2 className="mt-10 text-3xl text-primary">Where we deliver</h2>
      <p className="mt-2">Liverpool postcodes L1–L8, L11–L19, L24–L28, L36 and L70. Further afield? Call us on 0151 724 4850 and we’ll send through a trusted partner florist.</p>
      <h2 className="mt-10 text-3xl text-primary">Freshness guarantee</h2>
      <p className="mt-2">Every bouquet carries a 7-day freshness guarantee.</p>
    </article>
  ),
});
