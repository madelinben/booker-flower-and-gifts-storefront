import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { fetchRoute, finishStop, optimiseRoute, saveRouteLayout } from '~/data/Route/route-actions';
import type { RouteDetail, Stop } from '~/data/Route/route-dal';
import { assignSections, type RouteItem } from '~/domain/route/route-planner';
import { directionsUrl } from '~/services/maps/google-maps';

export const Route = createFileRoute('/driver/route/$id')({
  loader: ({ params }) => fetchRoute({ data: { id: Number(params.id) } }),
  component: RoutePage,
});

type Row = { key: string; item: RouteItem };
const toRows = (stops: Stop[]): Row[] => {
  const rows: Row[] = [];
  let section = stops[0]?.section;
  for (const s of stops) {
    if (s.section !== section) { rows.push({ key: `break-${s.section}`, item: { type: 'break' } }); section = s.section; }
    rows.push({ key: `stop-${s.id}`, item: { type: 'stop', id: s.id } });
  }
  return rows;
};

function RoutePage() {
  const route = Route.useLoaderData();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => toRows(route.stops));
  useEffect(() => setRows(toRows(route.stops)), [route]);
  const stops = useMemo(() => new Map(route.stops.map((s) => [s.id, s])), [route]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function persist(next: Row[]) {
    setRows(next);
    await saveRouteLayout({ data: { routeId: route.id, items: next.map((r) => r.item) } });
    await router.invalidate();
  }
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rows.findIndex((r) => r.key === e.active.id);
    const to = rows.findIndex((r) => r.key === e.over!.id);
    void persist(arrayMove(rows, from, to));
  }
  const sectionOf = useMemo(() => {
    const map = new Map(assignSections(rows.map((r) => r.item)).map((l) => [l.id, l]));
    return (id: number) => map.get(id);
  }, [rows]);
  const sectionCount = Math.max(1, ...assignSections(rows.map((r) => r.item)).map((l) => l.section));

  return (
    <section className="mt-6">
      <h1 className="text-4xl text-primary">Route {route.id} · {route.routeDate}</h1>
      <img src={`/api/route-map?id=${route.id}`} alt={`Map of route from ${route.startLabel} through ${route.stops.length} stops to ${route.endLabel}`} className="mt-4 w-full rounded-2xl border border-border bg-blush/40" />
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="min-h-11 rounded-full border border-brass px-4 text-sm hover:border-accent" onClick={async () => { await optimiseRoute({ data: { routeId: route.id, sections: sectionCount } }); await router.invalidate(); }}>Re-plan shortest route</button>
        <button className="min-h-11 rounded-full border border-brass px-4 text-sm hover:border-accent" onClick={() => void persist([...rows, { key: `break-new-${Date.now()}`, item: { type: 'break' } }])}>+ Section break</button>
      </div>
      <p className="mt-3 text-xs text-muted">Drag stops (or tab to a handle and use space + arrow keys) to reorder. Drag a section break to move where a section starts.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
          <ol className="mt-4 space-y-2">
            {rows.map((r) => (
              <SortableRow key={r.key} id={r.key}>
                {r.item.type === 'break'
                  ? <BreakRow onRemove={() => void persist(rows.filter((x) => x.key !== r.key))} />
                  : <StopCard stop={stops.get(r.item.id)!} number={sectionOf(r.item.id)} route={route} onChanged={() => router.invalidate()} />}
              </SortableRow>
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <h2 className="mt-10 text-2xl text-primary">Navigate a section</h2>
      <ul className="mt-2 space-y-2">
        {Array.from({ length: sectionCount }, (_, i) => i + 1).map((n) => {
          const pts = route.stops.filter((s) => (sectionOf(s.id)?.section ?? 1) === n && s.lat !== null).sort((a, b) => (sectionOf(a.id)?.position ?? 0) - (sectionOf(b.id)?.position ?? 0)).map((s) => ({ lat: s.lat!, lng: s.lng! }));
          if (!pts.length) return null;
          const origin = n === 1 ? { lat: route.startLat, lng: route.startLng } : pts[0];
          const dest = n === sectionCount ? { lat: route.endLat, lng: route.endLng } : pts[pts.length - 1];
          return <li key={n}><a href={directionsUrl(origin, pts, dest)} target="_blank" rel="noreferrer" className="inline-block min-h-11 content-center rounded-full bg-primary px-6 text-sm text-primary-foreground">Open section {n} in Google Maps</a></li>;
        })}
      </ul>
    </section>
  );
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-stretch gap-2 ${isDragging ? 'opacity-70' : ''}`}>
      <button {...attributes} {...listeners} aria-label="Drag to reorder" className="min-h-11 w-11 shrink-0 cursor-grab touch-none rounded-xl border border-border bg-white text-muted">⋮⋮</button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function BreakRow({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 text-xs tracking-[0.25em] text-brass uppercase">
      <span className="h-px flex-1 bg-brass/60" />Section break<button onClick={onRemove} className="min-h-10 px-2 underline">remove</button><span className="h-px flex-1 bg-brass/60" />
    </div>
  );
}

function StopCard({ stop, number, route, onChanged }: { stop: Stop; number?: { section: number; position: number }; route: RouteDetail; onChanged: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const done = stop.status !== 'PENDING';

  async function finish(result: 'DELIVERED' | 'FAILED') {
    setBusy(true);
    setError('');
    try {
      if (file) {
        const form = new FormData();
        form.set('stopId', String(stop.id));
        form.set('photo', file);
        const res = await fetch('/api/stop-photo', { method: 'POST', body: form });
        if (!res.ok) { setError(await res.text()); return; }
      }
      await finishStop({ data: { stopId: stop.id, result, note } });
      setOpen(false);
      await onChanged();
    } catch {
      setError('Could not save. Check your signal and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${done ? 'border-sage bg-sage/30' : 'border-border bg-white/70'}`}>
      <button className="flex min-h-11 w-full items-start justify-between gap-3 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span><span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{number ? `${number.section}.${number.position + 1}` : '–'}</span>{stop.recipientName}
          <span className="block text-sm text-muted">{stop.addressLine1}{stop.addressLine2 && `, ${stop.addressLine2}`}, {stop.postcode}</span></span>
        <span className="text-xs">{stop.status === 'DELIVERED' ? '✓ Delivered' : stop.status === 'FAILED' ? '✗ Failed' : ''}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          {stop.recipientPhone && <p><a className="underline" href={`tel:${stop.recipientPhone}`}>{stop.recipientPhone}</a></p>}
          {stop.giftMessage && <p className="italic">“{stop.giftMessage}”</p>}
          {stop.photoKey && <img src={`/photos/${stop.photoKey}`} alt="Delivery proof" className="max-h-48 rounded-xl" />}
          {!done && (
            <>
              <label className="block">Note for the customer / shop<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className="mt-1 block w-full rounded border border-border bg-white p-2" /></label>
              <label className="block">Photo (doorstep / left with neighbour)<input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block min-h-11" /></label>
              {error && <p role="alert" className="text-accent">{error}</p>}
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => void finish('DELIVERED')} className="min-h-12 flex-1 rounded-full bg-primary text-primary-foreground disabled:opacity-50">Delivered</button>
                <button disabled={busy} onClick={() => void finish('FAILED')} className="min-h-12 flex-1 rounded-full border border-accent text-accent disabled:opacity-50">Couldn’t deliver</button>
              </div>
            </>
          )}
          {done && stop.note && <p>Note: {stop.note}</p>}
          <p className="text-xs text-muted">Order {stop.externalRef} · route {route.id}</p>
        </div>
      )}
    </div>
  );
}
