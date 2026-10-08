import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getProduct, listCategories, listProducts, saveProduct } from '~/data/Catalog/catalog-dal';
import { requireStaff } from '~/services/auth/current-staff';
import { getServerEnvironment } from '~/services/environment/server-environment';

export const fetchCategories = createServerFn({ method: 'GET' }).handler(() => listCategories(getServerEnvironment().DB));

export const fetchProducts = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ category: z.string().optional() }))
  .handler(({ data }) => listProducts(getServerEnvironment().DB, data));

export const fetchProduct = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(({ data }) => getProduct(getServerEnvironment().DB, data.slug));

export const fetchAdminProducts = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff('admin');
  return listProducts(getServerEnvironment().DB, { includeUnpublished: true });
});

export const fetchAdminProduct = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    await requireStaff('admin');
    return getProduct(getServerEnvironment().DB, data.slug, true);
  });

const productInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes'),
  name: z.string().min(1),
  description: z.string(),
  categorySlug: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  published: z.boolean(),
  variants: z.array(z.object({ label: z.string().min(1), pricePence: z.number().int().nonnegative() })).min(1),
});

export const saveAdminProduct = createServerFn({ method: 'POST' })
  .inputValidator(productInput)
  .handler(async ({ data }) => {
    await requireStaff('admin');
    await saveProduct(getServerEnvironment().DB, data);
    return { ok: true };
  });
