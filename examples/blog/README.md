# M Journal

This folder is a small blog built with `m.js` templates.

## Pages

- `#/articles` lists all published posts
- `#/articles/building-a-blog-with-m-js-templates` shows an article detail page
- `#/about` shows a static page
- `#/contact` shows a page-owned reactive form

## Managing Posts

Edit [`posts.js`](./posts.js). Add a new object to `window.blogPosts`:

```js
{
  title: "My New Post",
  date: "2026-05-27",
  excerpt: "Short summary for the article list.",
  tags: ["notes"],
  body: `
    <p>Your post HTML goes here.</p>
  `,
}
```

If you do not add a `slug`, `M.createPostManager()` creates one from the title.

Run from a local server:

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080/blog/
```
