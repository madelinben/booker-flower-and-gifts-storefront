import { createFileRoute } from '@tanstack/react-router';
import { completePendingCheckout } from '~/data/Order/checkout-actions';
import { getOrder } from '~/data/Order/order-dal';
import { requireSetting } from '~/services/environment/require-setting';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { notifyCustomer } from '~/services/notifications/notify-customer';
import { verifyStripeSignature } from '~/services/payments/stripe';

export const Route = createFileRoute('/api/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = getServerEnvironment();
        const body = await request.text();
        if (!(await verifyStripeSignature(body, request.headers.get('stripe-signature'), requireSetting(env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET')))) {
          return new Response('Bad signature', { status: 400 });
        }
        const event = JSON.parse(body) as { type: string; data: { object: { client_reference_id?: string; amount_total?: number } } };
        if (event.type === 'checkout.session.completed') {
          const { client_reference_id: pendingId, amount_total: total } = event.data.object;
          if (pendingId && typeof total === 'number') {
            const result = await completePendingCheckout(env, pendingId, total);
            if (result === 'amount_mismatch') console.error(`Stripe amount mismatch for pending checkout ${pendingId}.`);
            if (result === 'created') {
              const row = await env.DB.prepare('SELECT id FROM orders WHERE source = ?1 AND external_ref = ?2').bind('stripe', pendingId).first<{ id: number }>();
              const order = row && (await getOrder(env.DB, row.id));
              if (order) await notifyCustomer(env, order, 'PAID');
            }
          }
        }
        return new Response('ok');
      },
    },
  },
});
