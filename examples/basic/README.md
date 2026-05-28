# m.js Templating Example

This folder shows how to use `m.js` as a tiny layout renderer before starting a normal reactive app.

`index.html` renders `base.html`, replaces `<m-slot name="content"></m-slot>` with a page from `pages/`, resolves `<m-include>` partials, fills `{{ placeholders }}`, then runs any scripts included by the selected page.

The page routing is handled by `M.startTemplateRouter(...)`, which uses the library's `M.getPageName(...)` and `M.renderCurrentPage(...)` helpers internally.

Available pages:

- `#/about`
- `#/counter`
- `#/todos`

The old query-string style, such as `index.html?page=about`, still redirects to the matching hash route.

Run it from a local web server so `fetch()` can load the HTML files:

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080/basic/
```
