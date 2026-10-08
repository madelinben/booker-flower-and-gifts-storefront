import { redirect } from '@tanstack/react-router';
import { fetchStaff } from '~/data/Staff/fetch-staff';
import type { StaffRole } from '~/data/Staff/staff-dal';

/** `beforeLoad` helper: send anonymous or wrong-role visitors through Google sign-in, then back. */
export async function guardRoute(pathname: string, ...roles: StaffRole[]) {
  const staff = await fetchStaff();
  if (!staff || !roles.includes(staff.role)) throw redirect({ href: `/auth/login?next=${encodeURIComponent(pathname)}` });
  return { staff };
}
