INSERT INTO categories (slug, name, kind, position) VALUES
  ('hand-tied', 'Hand-tied bouquets', 'type', 1),
  ('vase', 'Vase arrangements', 'type', 2),
  ('hampers', 'Gift hampers', 'type', 3),
  ('subscriptions', 'Subscriptions', 'type', 4),
  ('funerals', 'Funeral tributes', 'type', 5),
  ('birthday', 'Birthday', 'occasion', 10),
  ('anniversary', 'Anniversary', 'occasion', 11),
  ('thank-you', 'Thank you', 'occasion', 12),
  ('new-baby', 'New baby', 'occasion', 13);

INSERT INTO products (slug, name, description, category_slug, published) VALUES
  ('petals-of-pink-joy', 'Petals of Pink Joy', 'Soft pink roses, lisianthus and eucalyptus, tied by hand and wrapped in kraft paper.', 'hand-tied', 1),
  ('golden-sunshine', 'Golden Sunshine', 'Sunflowers, golden roses and seasonal foliage — a bouquet that brightens any doorstep.', 'hand-tied', 1),
  ('florists-choice', 'Florist’s Choice', 'Our florists pick the freshest seasonal stems and arrange them by hand.', 'hand-tied', 1),
  ('hamper-classic', 'Classic Gift Hamper', 'Chocolates, preserves and a small posy, packed in a woven basket.', 'hampers', 1),
  ('sympathy-posy', 'Sympathy Posy', 'A quiet arrangement of white roses and lisianthus.', 'funerals', 1);

INSERT INTO product_variants (product_slug, label, price_pence) VALUES
  ('petals-of-pink-joy', 'Standard', 5500), ('petals-of-pink-joy', 'Deluxe', 7500), ('petals-of-pink-joy', 'Luxury', 10000),
  ('golden-sunshine', 'Standard', 6500), ('golden-sunshine', 'Deluxe', 8500),
  ('florists-choice', 'Standard', 5000), ('florists-choice', 'Deluxe', 7000), ('florists-choice', 'Luxury', 9500),
  ('hamper-classic', 'Standard', 6500), ('hamper-classic', 'Large', 9500),
  ('sympathy-posy', 'Standard', 6000);
