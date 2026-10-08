import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { listStaff, upsertStaff } from '~/data/Staff/staff-dal';
import { requireStaff } from '~/services/auth/current-staff';
import { getServerEnvironment } from '~/services/environment/server-environment';

export const fetchStaffList = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff('admin');
  return listStaff(getServerEnvironment().DB);
});

export const saveStaff = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.email(), role: z.enum(['admin', 'driver']), active: z.boolean() }))
  .handler(async ({ data }) => {
    const me = await requireStaff('admin');
    if (me.email.toLowerCase() === data.email.toLowerCase() && !data.active) throw new Error('You cannot deactivate yourself.');
    await upsertStaff(getServerEnvironment().DB, data.email, data.role, data.active);
    return { ok: true };
  });
