import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { Ladybird } from '~/components/Ladybird';
import { guardRoute } from '~/services/auth/route-guard';

export const Route = createFileRoute('/driver')({
  beforeLoad: ({ location }) => guardRoute(location.pathname, 'driver', 'admin'),
  head: () => ({ meta: [{ title: 'Driver portal | Booker Flowers' }, { name: 'robots', content: 'noindex' }] }),
  component: DriverLayout,
});

function DriverLayout() {
  const { staff } = Route.useRouteContext();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between border-b border-brass pb-3">
        <Link to="/driver" className="flex items-center gap-2 font-display text-2xl italic text-primary"><Ladybird className="size-8" />Driver portal</Link>
        <form method="post" action="/auth/logout" className="text-xs text-muted">{staff.email} · <button className="min-h-10 underline">Sign out</button></form>
      </div>
      <Outlet />
    </div>
  );
}
