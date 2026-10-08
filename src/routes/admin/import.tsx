import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { importOrdersCsv } from '~/data/Order/order-actions';
import { pounds } from '~/features/format';

export const Route = createFileRoute('/admin/import')({ component: Import });

type Result = Awaited<ReturnType<typeof importOrdersCsv>>;

function Import() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [done, setDone] = useState<number | null>(null);

  async function run(commit: boolean) {
    const r = await importOrdersCsv({ data: { csv, commit } });
    setResult(r);
    setDone(commit ? r.created : null);
  }

  return (
    <section className="mt-6 max-w-3xl">
      <h1 className="text-4xl text-primary">Import orders from CSV</h1>
      <p className="mt-3 text-muted">
        Test-data import. Header row required: <code>external_ref, customer_email, recipient_name, recipient_phone, address_line1, address_line2, city, postcode, delivery_date, slot, gift_message, items</code>.
        Items are <code>Name:qty:price;Name:qty:price</code>. Slot is <code>standard</code>, <code>same_day</code> or <code>morning</code>. Re-importing the same <code>external_ref</code> is safe. Example: <a className="underline" href="https://github.com/madelinben/booker-flower-and-gifts-storefront/blob/main/docs/sample-orders.csv">docs/sample-orders.csv</a>.
      </p>
      <input type="file" accept=".csv,text/csv" aria-label="CSV file" className="mt-6 block min-h-10" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setCsv(await f.text()); setResult(null); setDone(null); } }} />
      <textarea value={csv} onChange={(e) => { setCsv(e.target.value); setResult(null); }} rows={8} aria-label="CSV text" placeholder="…or paste CSV here" className="mt-4 w-full rounded border border-border bg-white p-3 font-mono text-xs" />
      <div className="mt-4 flex gap-3">
        <button disabled={!csv} onClick={() => void run(false)} className="min-h-11 rounded-full border border-brass px-6 text-sm disabled:opacity-40">Preview</button>
        <button disabled={!csv || !result || result.errors.length > 0 && result.total === 0} onClick={() => void run(true)} className="min-h-11 rounded-full bg-primary px-6 text-sm text-primary-foreground disabled:opacity-40">Import valid rows</button>
      </div>
      {result && (
        <div className="mt-6" role="status">
          <p>{result.total} valid order(s){done !== null && <> — <strong>{done} new imported</strong>, {result.total - done} already present</>}.</p>
          {result.errors.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-accent">{result.errors.map((e) => <li key={e.line}>Line {e.line}: {e.message}</li>)}</ul>
          )}
          <ul className="mt-3 text-sm text-muted">{result.sample.map((o) => <li key={o.externalRef}>{o.externalRef} · {o.recipientName} · {o.postcode} · {o.deliveryDate} · {pounds(o.totalPence)}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
