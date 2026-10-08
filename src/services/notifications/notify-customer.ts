import type { OrderDetail } from '~/data/Order/order-dal';
import type { OrderStatus } from '~/domain/order/order-status';
import type { ServerEnvironment } from '~/services/environment/server-environment';

const SUBJECT: Partial<Record<OrderStatus, string>> = {
  PAID: 'We’ve received your order',
  OUT_FOR_DELIVERY: 'Your flowers are on their way',
  DELIVERED: 'Your flowers have been delivered',
  FAILED: 'We couldn’t deliver your flowers today',
};
const BODY: Partial<Record<OrderStatus, string>> = {
  PAID: 'Thank you — our florists will start arranging your order shortly.',
  OUT_FOR_DELIVERY: 'Our driver has loaded the van and your order is out for delivery today.',
  DELIVERED: 'Your order has been delivered.',
  FAILED: 'Our driver could not complete the delivery. We will be in touch to rearrange.',
};

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function buildEmail(order: OrderDetail, status: OrderStatus, extra?: { note?: string; photoUrl?: string }) {
  const subject = SUBJECT[status];
  if (!subject) return null;
  const lines = order.lines.map((l) => `<li>${l.quantity} × ${escapeHtml(l.productName)}</li>`).join('');
  const html = `<div style="font-family:Georgia,serif;color:#1f2f27"><h2>${subject}</h2><p>${BODY[status]}</p>
    <p>Delivering to ${escapeHtml(order.recipientName)}, ${escapeHtml(order.addressLine1)}, ${escapeHtml(order.postcode)}.</p><ul>${lines}</ul>
    ${extra?.note ? `<p><em>Driver note: ${escapeHtml(extra.note)}</em></p>` : ''}
    ${extra?.photoUrl ? `<p><img src="${escapeHtml(extra.photoUrl)}" alt="Delivery photo" style="max-width:100%;border-radius:12px"></p>` : ''}
    <p>Booker Flowers &amp; Gifts · 0151 724 4850</p></div>`;
  return { subject, html };
}

/** Best effort: a failed email is logged, never thrown, so it cannot undo the status change that triggered it. */
export async function notifyCustomer(env: ServerEnvironment, order: OrderDetail, status: OrderStatus, extra?: { note?: string; photoUrl?: string }): Promise<void> {
  const email = buildEmail(order, status, extra);
  if (!email || !env.RESEND_API_KEY || !env.NOTIFICATION_FROM_EMAIL) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.NOTIFICATION_FROM_EMAIL, to: order.customerEmail, subject: email.subject, html: email.html }),
    });
    if (!res.ok) console.error(`Resend failed with status ${res.status} for order ${order.id}.`);
  } catch (error) {
    console.error('Resend request failed.', error);
  }
}
