-- Checkout details held while the customer is on Stripe; the webhook turns one into an order.
CREATE TABLE pending_checkouts (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
