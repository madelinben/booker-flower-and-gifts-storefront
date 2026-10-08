import { Link } from '@tanstack/react-router';
import type { Product } from '~/data/Catalog/catalog-dal';
import { pounds } from '~/features/format';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="lift block rounded-2xl">
      {product.imageUrl ? <img src={product.imageUrl} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover" loading="lazy" /> : <div className="bloom aspect-[4/5] rounded-2xl" aria-hidden />}
      <h3 className="mt-4 text-2xl text-primary">{product.name}</h3>
      <p className="text-muted">from {pounds(product.fromPence)}</p>
    </Link>
  );
}
