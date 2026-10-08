import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { fetchDepot, fetchLoadableOrders, fetchMyRoutes, startRoute } from '~/data/Route/route-actions';
import { SLOT_LABEL } from '~/domain/delivery/delivery-rules';
import { todayIso } from '~/features/format';

export const Route = createFileRoute('/driver/')({
  loader: async () => ({ routes: await fetchMyRoutes(), depot: await fetchDepot() }),
  component: DriverHome,
});

function DriverHome() {
  const { routes, depot } = Route.useLoaderData();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIso());
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof fetchLoadableOrders>> | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [startLabel, setStartLabel] = useState(depot.label);
  const [endLabel, setEndLabel] = useState(depot.label);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const o = await fetchLoadableOrders({ data: { date } });
    setOrders(o);
    setPicked(new Set(o.map((x) => x.id)));
  }
  async function go() {
    setBusy(true);
    setError('');
    try {
      const res = await startRoute({ data: { date, orderIds: [...picked], start: { label: startLabel, lat: depot.lat, lng: depot.lng }, end: { label: endLabel, lat: depot.lat, lng: depot.lng } } });
      if ('routeId' in res && res.routeId) await navigate({ to: '/driver/route/$id', params: { id: String(res.routeId) } });
      else setError('error' in res && res.error ? res.error : 'Could not plan the route.');
    } catch {
      setError('Could not plan the route. Check the Google Maps key and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mt-6">
        <h1 className="text-4xl text-primary">Load the van</h1>
        <div className="mt-4 flex items-end gap-3">
          <label className="text-sm">Delivery date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block min-h-11 rounded border border-border bg-white px-3" /></label>
          <button onClick={() => void load()} className="min-h-11 rounded-full bg-primary px-6 text-sm text-primary-foreground">Show ready orders</button>
        </div>
        {orders && (
          <div className="mt-6">
            {orders.length === 0 ? <p className="text-muted">No orders are marked ready for {date}. Ask the shop to mark them ready.</p> : (
              <>
                <ul className="divide-y divide-border">
                  {orders.map((o) => (
                    <li key={o.id}><label className="flex min-h-12 items-center gap-3 py-2">
                      <input type="checkbox" className="size-5" checked={picked.has(o.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (!n.delete(o.id)) n.add(o.id); return n; })} />
                      <span>{o.recipientName}<span className="block text-sm text-muted">{o.addressLine1}, {o.postcode} · {SLOT_LABEL[o.slot]}</span></span>
                    </label></li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Start<input value={startLabel} onChange={(e) => setStartLabel(e.target.value)} className="mt-1 block min-h-11 w-full rounded border border-border bg-white px-3" /></label>
                  <label className="text-sm">End<input value={endLabel} onChange={(e) => setEndLabel(e.target.value)} className="mt-1 block min-h-11 w-full rounded border border-border bg-white px-3" /></label>
                </div>
                <p className="mt-2 text-xs text-muted">Start and end use the depot location; the labels are for your reference.</p>
                {error && <p role="alert" className="mt-3 text-sm text-accent">{error}</p>}
                <button disabled={busy || picked.size === 0} onClick={() => void go()} className="mt-4 min-h-12 w-full rounded-full bg-accent px-6 text-sm tracking-widest text-white uppercase disabled:opacity-50">{busy ? 'Planning route…' : `Load ${picked.size} order(s) & plan route`}</button>
              </>
            )}
          </div>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-3xl text-primary">My routes</h2>
        <ul className="mt-3 divide-y divide-border">
          {routes.map((r) => <li key={r.id}><Link to="/driver/route/$id" params={{ id: String(r.id) }} className="block min-h-12 py-3 hover:text-accent">Route {r.id} · {r.routeDate}</Link></li>)}
          {routes.length === 0 && <li className="py-3 text-muted">No routes yet.</li>}
        </ul>
      </section>
    </>
  );
}
