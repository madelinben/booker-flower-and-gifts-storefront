import { createFileRoute, useRouter } from '@tanstack/react-router';
import { fetchStaffList, saveStaff } from '~/data/Staff/staff-actions';

export const Route = createFileRoute('/admin/staff')({ loader: () => fetchStaffList(), component: Staff });

function Staff() {
  const staff = Route.useLoaderData();
  const router = useRouter();
  const save = async (email: string, role: 'admin' | 'driver', active: boolean) => {
    await saveStaff({ data: { email, role, active } });
    await router.invalidate();
  };
  return (
    <section className="mt-6 max-w-2xl">
      <h1 className="text-4xl text-primary">Staff &amp; drivers</h1>
      <p className="mt-2 text-muted">Everyone signs in with their Google account. Drivers only see the driver portal.</p>
      <form className="mt-6 flex flex-wrap items-end gap-3" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void save(String(f.get('email')), f.get('role') as 'admin' | 'driver', true).then(() => e.currentTarget.reset());
      }}>
        <label className="text-sm">Google email<input name="email" type="email" required className="mt-1 block min-h-10 rounded border border-border bg-white px-3" /></label>
        <label className="text-sm">Role<select name="role" className="mt-1 block min-h-10 rounded border border-border bg-white px-3"><option value="driver">Driver</option><option value="admin">Admin</option></select></label>
        <button className="min-h-10 rounded-full bg-primary px-6 text-sm text-primary-foreground">Add / update</button>
      </form>
      <ul className="mt-8 divide-y divide-border">
        {staff.map((s) => (
          <li key={s.email} className="flex items-center justify-between py-3">
            <span>{s.email} <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-xs">{s.role}</span>{!s.active && <span className="ml-2 text-xs text-accent">inactive</span>}</span>
            <button className="min-h-10 text-sm underline" onClick={() => void save(s.email, s.role, !s.active)}>{s.active ? 'Deactivate' : 'Reactivate'}</button>
          </li>
        ))}
        {staff.length === 0 && <li className="py-4 text-muted">No staff yet — the bootstrap admin can always sign in.</li>}
      </ul>
    </section>
  );
}
