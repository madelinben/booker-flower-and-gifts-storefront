import { getCookie } from '@tanstack/react-start/server';
import { findStaff, type StaffMember } from '~/data/Staff/staff-dal';
import { readSessionToken, SESSION_COOKIE } from '~/services/auth/session';
import { getServerEnvironment } from '~/services/environment/server-environment';

/** Signed-in staff for this request, re-checked against the `staff` table every time so removing someone locks them out. */
export async function getCurrentStaff(): Promise<StaffMember | null> {
  const env = getServerEnvironment();
  if (!env.SESSION_SECRET) return null;
  const email = await readSessionToken(getCookie(SESSION_COOKIE), env.SESSION_SECRET);
  if (!email) return null;
  if (env.BOOTSTRAP_ADMIN_EMAIL && email.toLowerCase() === env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return { email, role: 'admin', active: true };
  const staff = await findStaff(env.DB, email);
  return staff?.active ? staff : null;
}

/** Throws unless the caller holds one of `roles`. For server functions and API routes. */
export async function requireStaff(...roles: StaffMember['role'][]): Promise<StaffMember> {
  const staff = await getCurrentStaff();
  if (!staff || !roles.includes(staff.role)) throw new Response('Forbidden', { status: 403 });
  return staff;
}
