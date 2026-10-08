export type StaffRole = 'admin' | 'driver';
export interface StaffMember { email: string; role: StaffRole; active: boolean }

interface StaffRow { email: string; role: StaffRole; active: number }
const toStaff = (r: StaffRow): StaffMember => ({ email: r.email, role: r.role, active: r.active === 1 });

export async function findStaff(db: D1Database, email: string): Promise<StaffMember | null> {
  const row = await db.prepare('SELECT email, role, active FROM staff WHERE email = ?1').bind(email.toLowerCase()).first<StaffRow>();
  return row ? toStaff(row) : null;
}

export async function listStaff(db: D1Database): Promise<StaffMember[]> {
  const { results } = await db.prepare('SELECT email, role, active FROM staff ORDER BY role, email').all<StaffRow>();
  return results.map(toStaff);
}

export async function upsertStaff(db: D1Database, email: string, role: StaffRole, active: boolean): Promise<void> {
  await db
    .prepare('INSERT INTO staff (email, role, active) VALUES (?1, ?2, ?3) ON CONFLICT(email) DO UPDATE SET role = ?2, active = ?3')
    .bind(email.toLowerCase(), role, active ? 1 : 0)
    .run();
}
