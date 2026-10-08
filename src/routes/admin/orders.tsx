import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { changeOrderStatus, fetchOrder, fetchOrders } from '~/data/Order/order-actions';
import type { OrderDetail } from '~/data/Order/order-dal';
import { SLOT_LABEL } from '~/domain/delivery/delivery-rules';
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from '~/domain/order/order-status';
import { nextStatuses } from '~/domain/order/order-transitions';
import { pounds } from '~/features/format';

const search = z.object({ date: z.string().optional(), status: z.enum(ORDER_STATUSES).optional() });

export const Route = createFileRoute('/admin/orders')({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchOrders({ data: deps }),
  component: Orders,
});

function Orders() {
  const orders = Route.useLoaderData();
  const { date, status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [open, setOpen] = useState<OrderDetail | null>(null);

  async function show(id: number) {
    setOpen(await fetchOrder({ data: { id } }));
  }
  async function move(id: number, from: (typeof ORDER_STATUSES)[number], to: (typeof ORDER_STATUSES)[number]) {
    await changeOrderStatus({ data: { id, from, to } });
    await router.invalidate();
    await show(id);
  }

  return (
    <section className="mt-6">
      <h1 className="text-4xl text-primary">Orders</h1>
      <form className="mt-4 flex flex-wrap items-end gap-4" onChange={(e) => {
        const f = new FormData(e.currentTarget);
        void navigate({ search: { date: (f.get('date') as string) || undefined, status: (f.get('status') as typeof status) || undefined } });
      }}>
        <label className="text-sm">Delivery date<input name="date" type="date" defaultValue={date} className="mt-1 block min-h-10 rounded border border-border bg-white px-3" /></label>
        <label className="text-sm">Status
          <select name="status" defaultValue={status ?? ''} className="mt-1 block min-h-10 rounded border border-border bg-white px-3">
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-brass text-xs tracking-widest text-muted uppercase"><tr><th className="py-2">Ref</th><th>Deliver</th><th>Recipient</th><th>Postcode</th><th>Slot</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="cursor-pointer border-b border-border hover:bg-blush/40" onClick={() => void show(o.id)}>
                <td className="py-3"><button className="min-h-10 underline">{o.externalRef}</button></td>
                <td>{o.deliveryDate}</td><td>{o.recipientName}</td><td>{o.postcode}</td><td>{SLOT_LABEL[o.slot]}</td><td>{pounds(o.totalPence)}</td><td>{ORDER_STATUS_LABEL[o.status]}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted">No orders. Import a CSV or change the filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <aside className="mt-8 rounded-2xl border border-brass/60 bg-white/60 p-6" aria-label={`Order ${open.externalRef}`}>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl text-primary">{open.externalRef} · {ORDER_STATUS_LABEL[open.status]}</h2>
            <button className="min-h-10 text-sm underline" onClick={() => setOpen(null)}>Close</button>
          </div>
          <p className="mt-2 text-sm">{open.recipientName} · {open.recipientPhone}<br />{open.addressLine1} {open.addressLine2}, {open.city} {open.postcode}<br />Customer: {open.customerEmail}</p>
          {open.giftMessage && <p className="mt-3 italic">“{open.giftMessage}”</p>}
          <ul className="mt-3 text-sm">{open.lines.map((l, i) => <li key={i}>{l.quantity} × {l.productName} — {pounds(l.unitPricePence)}</li>)}</ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {nextStatuses(open.status).map((to) => (
              <button key={to} onClick={() => void move(open.id, open.status, to)} className="min-h-10 rounded-full border border-brass px-4 text-sm hover:border-accent hover:text-accent">→ {ORDER_STATUS_LABEL[to]}</button>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}
