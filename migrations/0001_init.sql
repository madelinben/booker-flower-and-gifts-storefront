-- No foreign keys, UTC ISO timestamps set by the app, named columns only (database.mdc).
CREATE TABLE staff (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('type', 'occasion')),
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL,
  image_url TEXT,
  published INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX products_category ON products (category_slug);

CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug TEXT NOT NULL,
  label TEXT NOT NULL,
  price_pence INTEGER NOT NULL CHECK (price_pence >= 0)
);
CREATE INDEX product_variants_product ON product_variants (product_slug);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'csv')),
  external_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'REFUNDED')),
  customer_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Liverpool',
  postcode TEXT NOT NULL,
  lat REAL,
  lng REAL,
  delivery_date TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('standard', 'same_day', 'morning')),
  gift_message TEXT NOT NULL DEFAULT '',
  total_pence INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (source, external_ref)
);
CREATE INDEX orders_delivery_date ON orders (delivery_date, status);

CREATE TABLE order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_pence INTEGER NOT NULL CHECK (unit_price_pence >= 0)
);
CREATE INDEX order_lines_order ON order_lines (order_id);

CREATE TABLE routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_email TEXT NOT NULL,
  route_date TEXT NOT NULL,
  start_label TEXT NOT NULL,
  start_lat REAL NOT NULL,
  start_lng REAL NOT NULL,
  end_label TEXT NOT NULL,
  end_lat REAL NOT NULL,
  end_lng REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX routes_driver_date ON routes (driver_email, route_date);

CREATE TABLE route_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  section INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
  note TEXT NOT NULL DEFAULT '',
  photo_key TEXT,
  completed_at TEXT,
  UNIQUE (route_id, order_id)
);
CREATE INDEX route_stops_route ON route_stops (route_id, section, position);
