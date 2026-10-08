import { z } from 'zod';
import { DELIVERY_SLOTS } from '~/domain/delivery/delivery-rules';

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, CRLF, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

const poundsToPence = (value: string): number => Math.round(Number(value) * 100);

/** `items` cell: `Name:qty:price` entries joined by `;` — e.g. `Petals of Pink Joy:1:55.00;Chocolates:2:6.50`. */
export const orderLineSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPricePence: z.number().int().nonnegative(),
});
export type CsvOrderLine = z.infer<typeof orderLineSchema>;

export function parseItems(cell: string): CsvOrderLine[] {
  return cell.split(';').map((s) => s.trim()).filter(Boolean).map((entry) => {
    const [name, qty, price] = entry.split(':').map((s) => s.trim());
    return orderLineSchema.parse({ productName: name, quantity: Number(qty), unitPricePence: poundsToPence(price ?? '') });
  });
}

const rowSchema = z.object({
  external_ref: z.string().min(1),
  customer_email: z.email(),
  recipient_name: z.string().min(1),
  recipient_phone: z.string().default(''),
  address_line1: z.string().min(1),
  address_line2: z.string().default(''),
  city: z.string().default('Liverpool'),
  postcode: z.string().regex(/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/, 'Not a UK postcode'),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  slot: z.enum(DELIVERY_SLOTS).default('standard'),
  gift_message: z.string().default(''),
  items: z.string().min(1),
});

export interface CsvOrder {
  externalRef: string;
  customerEmail: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  deliveryDate: string;
  slot: (typeof DELIVERY_SLOTS)[number];
  giftMessage: string;
  lines: CsvOrderLine[];
  totalPence: number;
}
export interface CsvRowError { line: number; message: string }
export interface CsvImportPreview { orders: CsvOrder[]; errors: CsvRowError[] }

/** Header row required; column order free. `line` is 1-based including the header, as in a spreadsheet. */
export function parseOrdersCsv(text: string): CsvImportPreview {
  const [header, ...body] = parseCsv(text.replace(/^﻿/, ''));
  if (!header) return { orders: [], errors: [{ line: 1, message: 'File is empty.' }] };
  const columns = header.map((h) => h.trim().toLowerCase());
  const orders: CsvOrder[] = [];
  const errors: CsvRowError[] = [];
  const seen = new Set<string>();
  body.forEach((cells, index) => {
    const line = index + 2;
    const raw = Object.fromEntries(columns.map((c, i) => [c, (cells[i] ?? '').trim()]));
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ line, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      return;
    }
    const r = parsed.data;
    if (seen.has(r.external_ref)) { errors.push({ line, message: `external_ref "${r.external_ref}" repeated in file` }); return; }
    let lines: CsvOrderLine[];
    try { lines = parseItems(r.items); } catch { errors.push({ line, message: 'items: use Name:qty:price;Name:qty:price' }); return; }
    seen.add(r.external_ref);
    orders.push({
      externalRef: r.external_ref, customerEmail: r.customer_email, recipientName: r.recipient_name, recipientPhone: r.recipient_phone,
      addressLine1: r.address_line1, addressLine2: r.address_line2, city: r.city, postcode: r.postcode.toUpperCase(),
      deliveryDate: r.delivery_date, slot: r.slot, giftMessage: r.gift_message, lines,
      totalPence: lines.reduce((sum, l) => sum + l.quantity * l.unitPricePence, 0),
    });
  });
  return { orders, errors };
}
