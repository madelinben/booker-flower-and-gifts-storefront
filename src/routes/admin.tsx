import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { guardRoute } from '~/services/auth/route-guard';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => guardRoute(location.pathname, 'admin'),
  head: () => ({ meta: [{ title: 'Admin | Booker Flowers' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminLayout,
});

const links = [['/admin/orders', 'Orders'], ['/admin/import', 'Import CSV'], ['/admin/products', 'Products'], ['/admin/staff', 'Staff']] as const;

function AdminLayout() {
  const { staff } = Route.useRouteContext();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brass pb-4">
        <nav aria-label="Admin" className="flex flex-wrap gap-6 text-sm tracking-wide uppercase">
          {links.map(([to, label]) => <Link key={to} to={to} className="min-h-10 content-center hover:text-accent" activeProps={{ className: 'text-accent underline underline-offset-8' }}>{label}</Link>)}
        </nav>
        <form method="post" action="/auth/logout" className="text-sm text-muted">
          {staff.email} · <button className="min-h-10 underline hover:text-accent">Sign out</button>
        </form>
      </div>
      <Outlet />
    </div>
  );
}
