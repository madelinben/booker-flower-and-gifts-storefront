// Stripe over plain fetch: two calls and one signature check do not justify the SDK's bundle size on the Worker.
const enc = new TextEncoder();

export interface StripeSessionInput {
  secretKey: string;
  pendingId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  items: { name: string; unitAmountPence: number; quantity: number }[];
}

export async function createStripeSession(input: StripeSessionInput): Promise<string> {
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.pendingId,
    'metadata[pending_id]': input.pendingId,
  });
  input.items.forEach((item, i) => {
    body.set(`line_items[${i}][quantity]`, String(item.quantity));
    body.set(`line_items[${i}][price_data][currency]`, 'gbp');
    body.set(`line_items[${i}][price_data][unit_amount]`, String(item.unitAmountPence));
    body.set(`line_items[${i}][price_data][product_data][name]`, item.name);
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Stripe checkout failed with status ${res.status}.`);
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error('Stripe returned no checkout url.');
  return json.url;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function signStripePayload(secret: string, timestamp: number, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${body}`)));
}

/** Stripe-Signature check: HMAC of `t.body`, constant-time compare, 5 minute replay window. */
export async function verifyStripeSignature(body: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(nowSeconds - t) > 300 || !parts.v1) return false;
  const expected = await signStripePayload(secret, t, body);
  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}
