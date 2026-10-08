import { atom } from 'nanostores';

export interface CartLine { variantId: number; productName: string; label: string; pricePence: number; quantity: number }
const KEY = 'booker-cart-v1';

// Hand-written guard instead of zod: this file ships to the browser.
function isLine(v: unknown): v is CartLine {
  const l = v as CartLine;
  return !!l && typeof l.variantId === 'number' && typeof l.productName === 'string' && typeof l.label === 'string' && typeof l.pricePence === 'number' && Number.isInteger(l.quantity) && l.quantity > 0;
}

function load(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

export const $cart = atom<CartLine[]>([]);
if (typeof window !== 'undefined') {
  $cart.set(load());
  $cart.listen((lines) => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode: cart lives in memory */ } });
}

export function addToCart(line: Omit<CartLine, 'quantity'>, quantity = 1) {
  const cart = $cart.get();
  const existing = cart.find((l) => l.variantId === line.variantId);
  $cart.set(existing ? cart.map((l) => (l === existing ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l)) : [...cart, { ...line, quantity }]);
}
export const setQuantity = (variantId: number, quantity: number) =>
  $cart.set($cart.get().flatMap((l) => (l.variantId !== variantId ? [l] : quantity > 0 ? [{ ...l, quantity: Math.min(20, quantity) }] : [])));
export const clearCart = () => $cart.set([]);
