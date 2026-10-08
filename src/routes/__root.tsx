import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { Ladybird } from '~/components/Ladybird';
import appCss from '~/styles/global.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Booker Flowers & Gifts | Award-winning Liverpool florist' },
      { name: 'description', content: 'Hand-tied bouquets, funeral tributes, gift hampers and flower school from an award-winning independent Allerton florist. Our own vans deliver across Liverpool with a photo on the doorstep.' },
      { name: 'theme-color', content: '#fbf7f2' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }, { rel: 'stylesheet', href: appCss }],
  }),
  component: Root,
});

const nav = ['Flowers', 'Occasions', 'Gifts', 'Christmas', 'Funerals', 'Corporate', 'Flower School'];

function Root() {
  return (
    <html lang="en-GB">
      <head><HeadContent /></head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <p className="bg-primary px-4 py-2 text-center text-xs tracking-[0.18em] text-primary-foreground uppercase">
          Order before 2pm for same-day delivery across Liverpool · Photo on the doorstep
        </p>
        <div className="awning" aria-hidden />
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6">
          <Link to="/" className="flex items-center gap-3 font-display text-3xl italic leading-none text-primary" aria-label="Booker Flowers & Gifts home">
            <Ladybird className="size-11 transition-transform duration-500 hover:rotate-12" />
            <span>Booker <span className="block text-[0.7rem] not-italic tracking-[0.35em] text-muted uppercase">Flowers &amp; Gifts</span></span>
          </Link>
          <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-2 text-sm tracking-wide">
            {nav.map((n) => <a key={n} href={`#${n.toLowerCase().replace(' ', '-')}`} className="min-h-10 content-center hover:text-accent">{n}</a>)}
          </nav>
        </header>
        <main><Outlet /></main>
        <footer className="mt-24 bg-primary text-primary-foreground">
          <div className="awning" aria-hidden />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
            <div>
              <p className="flex items-center gap-3 font-display text-3xl italic"><Ladybird className="size-9" />Booker Flowers &amp; Gifts</p>
              <p className="mt-3 text-sm text-sage">Independent Liverpool florist, arranging by hand for over thirty years.</p>
            </div>
            <address className="text-sm not-italic leading-7 text-sage">
              7 Booker Avenue, Allerton<br />Liverpool L18 4QY<br /><a href="tel:01517244850" className="text-primary-foreground">0151 724 4850</a>
            </address>
            <p className="text-sm leading-7 text-sage">Mon–Sat 9am–5:30pm<br />Sun 10am–4pm</p>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
