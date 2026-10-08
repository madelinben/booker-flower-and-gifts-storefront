import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [{ title: 'Contact | Booker Flowers & Gifts' }, { name: 'description', content: 'Visit or call Booker Flowers & Gifts, 7 Booker Avenue, Allerton, Liverpool L18 4QY. 0151 724 4850.' }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-5xl text-primary">Visit or call us</h1>
      <address className="mt-6 text-lg not-italic leading-8">Booker Flowers &amp; Gifts<br />7 Booker Avenue, Allerton<br />Liverpool L18 4QY<br /><a className="underline" href="tel:01517244850">0151 724 4850</a></address>
      <p className="mt-6">Monday–Saturday 9am–5:30pm · Sunday 10am–4pm. Look for the red-spotted awning.</p>
    </article>
  ),
});
